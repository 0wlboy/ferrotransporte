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

    const body = await req.json().catch(() => ({}));

    let petitionId = body.petitionId;
    let status = body.status;
    let targetToken = body.to;
    let notificationTitle = body.title;
    let notificationBody = body.body;
    let notificationData = body.data || {};

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

    // Resolve passenger and driver identification
    let ciPasajero = null;
    let ciDriver = null;

    // Detect if request comes from a Supabase Database Webhook (pg_net)
    if (body.record && body.table === "peticiones") {
      console.log("Database Webhook detected on table: peticiones");
      petitionId = body.record.id;
      status = body.record.estado;
      ciPasajero = body.record.ci_pasajero;
      ciDriver = body.record.ci_driver;

      // 1. Skip if it's an UPDATE but the state didn't change (e.g. updating coordinates or other fields)
      if (body.type === "UPDATE" && body.old_record && body.old_record.estado === status) {
        console.log(`Omitiendo: El estado '${status}' no ha cambiado.`);
        return new Response(JSON.stringify({ message: "Omitido: el estado no ha cambiado" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Check if status is one of our target states (En Camino, En Sitio, Completado)
      const targetStatuses = ["En Camino", "En Sitio", "Completado"];
      if (!targetStatuses.includes(status)) {
        console.log(`Omitiendo: El estado '${status}' no requiere notificación.`);
        return new Response(JSON.stringify({ message: `Omitido: el estado '${status}' no requiere notificación` }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // If petitionId and status are provided directly (e.g. direct API test), fetch missing data from DB
    if (petitionId && status && (!ciPasajero || !targetToken)) {
      console.log(`Fetching petition details from DB for ID: ${petitionId}`);
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

      if (petitionData) {
        ciPasajero = petitionData.ci_pasajero;
        ciDriver = petitionData.ci_driver;
      }
    }

    // Resolve push notification parameters for status updates
    if (petitionId && status) {
      if (!ciPasajero) {
        return new Response(JSON.stringify({ error: "Passenger CI not found" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch passenger push token if not provided directly
      if (!targetToken) {
        const { data: passengerData, error: passengerError } = await supabaseAdmin
          .from("usuarios")
          .select("push_token")
          .eq("ci_user", ciPasajero)
          .maybeSingle();

        if (passengerError) {
          console.error("Error fetching passenger:", passengerError);
          return new Response(JSON.stringify({ error: passengerError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!passengerData?.push_token) {
          console.error(`No push token registered for passenger: ${ciPasajero}`);
          // Return 200 OK so Database Webhooks don't report constant failures when users haven't enabled push notifications
          return new Response(JSON.stringify({ message: "Passenger has no push token registered" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        targetToken = passengerData.push_token;
      }

      // Fetch driver name if available
      let driverName = "";
      if (ciDriver) {
        const { data: driverData, error: driverError } = await supabaseAdmin
          .from("usuarios")
          .select("primer_nombre, apellido")
          .eq("ci_user", ciDriver)
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

      // Construct payload based on status
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
