import { createClient } from "@supabase/supabase-js";

// Ambient declaration to prevent VS Code / TypeScript editor errors when Deno extension is not installed
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, title, body: customBody, data, petitionId, status } = await req.json().catch(() => ({}));

    let targetToken = to;
    let notificationTitle = title;
    let notificationBody = customBody;
    let notificationData = data || {};

    // Retrieve credentials from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables.");
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // If petitionId and status are provided, resolve target details from the DB
    if (petitionId && status) {
      console.log(`Processing petition ID: ${petitionId} for status: ${status}`);

      // 1. Fetch petition to get passenger and driver documents
      const { data: petitionData, error: petitionError } = await supabaseAdmin
        .from("peticiones")
        .select("ci_pasajero, ci_driver")
        .eq("id", petitionId)
        .maybeSingle();

      if (petitionError) {
        console.error("Error fetching petition:", petitionError);
        return new Response(JSON.stringify({ error: petitionError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!petitionData) {
        return new Response(JSON.stringify({ error: "Petition not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { ci_pasajero, ci_driver } = petitionData;

      if (!ci_pasajero) {
        return new Response(JSON.stringify({ error: "Petition has no passenger CI" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Fetch passenger push token
      const { data: passengerData, error: passengerError } = await supabaseAdmin
        .from("usuarios")
        .select("push_token")
        .eq("ci_user", ci_pasajero)
        .maybeSingle();

      if (passengerError) {
        console.error("Error fetching passenger:", passengerError);
        return new Response(JSON.stringify({ error: passengerError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!passengerData?.push_token) {
        return new Response(JSON.stringify({ error: "Passenger has no push token registered" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      targetToken = passengerData.push_token;

      // 3. Fetch driver name if available
      let driverName = "";
      if (ci_driver) {
        const { data: driverData, error: driverError } = await supabaseAdmin
          .from("usuarios")
          .select("primer_nombre, apellido")
          .eq("ci_user", ci_driver)
          .maybeSingle();

        if (driverError) {
          console.error("Error fetching driver:", driverError);
        } else if (driverData) {
          const primerNombre = driverData.primer_nombre || "";
          const apellido = driverData.apellido || "";
          driverName = `${primerNombre} ${apellido}`.trim();
        }
      }

      if (!driverName) {
        driverName = "El conductor";
      }

      // 4. Construct payload based on status
      notificationData = { ...notificationData, petitionId, status };

      if (status === "En Camino") {
        notificationTitle = "¡Tu transporte está en camino!";
        notificationBody = `El conductor ${driverName} ha aceptado tu viaje y va en camino.`;
      } else if (status === "En Sitio") {
        notificationTitle = "¡El conductor ha llegado!";
        notificationBody = `El conductor ${driverName} ya se encuentra en el punto de encuentro.`;
      } else if (status === "Completado") {
        notificationTitle = "¡Viaje completado!";
        notificationBody = "Tu viaje ha finalizado con éxito. ¡Gracias por viajar con nosotros!";
      } else {
        notificationTitle = "Actualización de tu transporte";
        notificationBody = `El estado de tu viaje ha cambiado a: ${status}.`;
      }
    }

    if (!targetToken) {
      return new Response(JSON.stringify({ error: "Missing push token recipient" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare Expo payload
    const expoPayload = {
      to: targetToken,
      sound: "default",
      title: notificationTitle || "Notificación de FerroTransporte",
      body: notificationBody || "Tienes una nueva actualización.",
      data: notificationData,
    };

    console.log("Sending push notification payload:", JSON.stringify(expoPayload));

    // Call Expo Push Service
    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expoPayload),
    });

    if (!expoRes.ok) {
      const errText = await expoRes.text();
      console.error("Expo Push API error response:", errText);
      return new Response(JSON.stringify({ error: `Expo API error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expoData = await expoRes.json();
    return new Response(JSON.stringify({ success: true, expoResponse: expoData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Internal Server Error:", err);
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
