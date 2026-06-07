import { supabase } from "@/utils/supabase";

interface ChangePetitionStatusProps {
  petitionId: string;
  status: string;

  // informacion del conductor
  ci_driver?: string;
  placa_vehiculo?: string;
  driverName?: string;
}

export interface UseChangePetitionStatusReturn {
  changePetitionStatus: (props: ChangePetitionStatusProps) => Promise<any>;
}

export function useChangePetitionStatus(): UseChangePetitionStatusReturn {
  const changePetitionStatus = async ({
    petitionId,
    status,
    ci_driver,
    placa_vehiculo,
    driverName,
  }: ChangePetitionStatusProps) => {
    try {
      console.log(
        "Petición actualizada:",
        petitionId,
        status,
        ci_driver,
        placa_vehiculo,
      );
      const { data, error } = await supabase
        .from("peticiones")
        .update({
          estado: status,
          ci_driver: ci_driver,
          placa_vehiculo: placa_vehiculo,
        })
        .eq("id", petitionId);

      if (error) throw error;

      if (status === "En Camino") {
        sendNotificationAsync(petitionId, driverName);
      }

      return data;
    } catch (error) {
      console.error("Error changing petition status:", error);
      throw error;
    }
  };

  return {
    changePetitionStatus,
  };
}

async function sendNotificationAsync(petitionId: string, driverName?: string) {
  try {
    const { data: petitionData } = await supabase
      .from("peticiones")
      .select("ci_pasajero")
      .eq("id", petitionId)
      .maybeSingle();

    if (petitionData?.ci_pasajero) {
      const { data: passengerData } = await supabase
        .from("usuarios")
        .select("push_token")
        .eq("ci_user", petitionData.ci_pasajero)
        .maybeSingle();

      if (passengerData?.push_token) {
        const title = "¡Tu transporte está en camino!";
        const body = driverName
          ? `El conductor ${driverName} ha aceptado tu viaje.`
          : "Un conductor ha aceptado tu petición de transporte.";

        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: passengerData.push_token,
            sound: "default",
            title,
            body,
            data: { petitionId },
          }),
        });
        console.log("Notificación push enviada exitosamente.");
      }
    }
  } catch (err) {
    console.error("Error al enviar notificación push:", err);
  }
}
