import { create } from "zustand";
import type { ComputeResultRecord } from "@/types/schemaTypes";

export type ComputeStatus = "idle" | "submitting" | "polling" | "completed" | "failed";

interface ComputeResultState {
    result: ComputeResultRecord | null;
    status: ComputeStatus;
    /** True while the execution status modal is visible. */
    isModalOpen: boolean;
    /** Timestamp (ms) when the modal was opened — used to enforce the 500 ms minimum display time. */
    openedAt: number | null;
    /** Error message set when status transitions to "failed". */
    error: string | null;
    setResult: (record: ComputeResultRecord) => void;
    /** Sets status. Calling with "submitting" opens the modal and captures the open timestamp. */
    setStatus: (status: ComputeStatus) => void;
    setError: (error: string) => void;
    /** Closes the modal and resets transient execution state. Preserves the last result. */
    closeModal: () => void;
    clearResult: () => void;
}

export const useComputeResultStore = create<ComputeResultState>((set) => ({
    result: null,
    status: "idle",
    isModalOpen: false,
    openedAt: null,
    error: null,

    setResult: (record) => set({ result: record, status: "completed" }),

    setStatus: (status) => {
        if (status === "submitting") {
            set({ status, isModalOpen: true, openedAt: Date.now(), error: null });
        } else {
            set({ status });
        }
    },

    setError: (error) => set({ error }),

    closeModal: () => set({ isModalOpen: false, status: "idle", error: null }),

    clearResult: () => set({ result: null, status: "idle", isModalOpen: false, openedAt: null, error: null }),
}));
