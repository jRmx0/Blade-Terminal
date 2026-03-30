import { create } from "zustand";
import type { ComputeResultRecord } from "@/types/schemaTypes";

export type ComputeStatus = "idle" | "submitting" | "polling" | "completed" | "failed";

interface ComputeResultState {
    result: ComputeResultRecord | null;
    status: ComputeStatus;
    setResult: (record: ComputeResultRecord) => void;
    setStatus: (status: ComputeStatus) => void;
    clearResult: () => void;
}

export const useComputeResultStore = create<ComputeResultState>((set) => ({
    result: null,
    status: "idle",

    setResult: (record) => set({ result: record, status: "completed" }),

    setStatus: (status) => set({ status }),

    clearResult: () => set({ result: null, status: "idle" }),
}));
