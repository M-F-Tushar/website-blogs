export interface AdminActionState {
  status: "idle" | "error";
  message: string | null;
}

export type AdminFormAction = (
  previousState: AdminActionState,
  formData: FormData,
) => Promise<AdminActionState>;

export const initialAdminActionState: AdminActionState = {
  status: "idle",
  message: null,
};
