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
      const updateData: any = { estado: status };
      if (ci_driver !== undefined) updateData.ci_driver = ci_driver;
      if (placa_vehiculo !== undefined) updateData.placa_vehiculo = placa_vehiculo;

      const { data, error } = await supabase
        .from("peticiones")
        .update(updateData)
        .eq("id", petitionId);

      if (error) throw error;

      if (status === "En Camino" || status === "En Sitio" || status === "Completado") {
        sendNotificationAsync(petitionId, status);
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

async function sendNotificationAsync(petitionId: string, status: string) {
  try {
    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        petitionId,
        status,
      },
    });

    if (error) {
      console.error("Error al invocar la Edge Function send-push-notification:", error);
    } else {
      console.log("Respuesta de la Edge Function:", data);
    }
  } catch (err) {
    console.error("Excepción al enviar la notificación push:", err);
  }
}
