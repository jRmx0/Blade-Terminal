import { create } from "zustand";
import { getAllComputationProviders } from "@server/db/computationProviders";
import { getAllComputationAlgorithms } from "@server/db/computationAlgorithms";
import { getAllAlgorithmParameters } from "@server/db/algorithmParameters";
import type { AlgorithmParameter, ComputationAlgorithm, ComputationProvider } from "@/types/serviceTypes";

interface ComputationCatalogState {
    providers: ComputationProvider[];
    algorithms: ComputationAlgorithm[];
    parameters: AlgorithmParameter[];

    setCatalog: (
        providers: ComputationProvider[],
        algorithms: ComputationAlgorithm[],
        parameters: AlgorithmParameter[],
    ) => void;

    setProviderAlgorithms: (
        providerId: number,
        algorithms: ComputationAlgorithm[],
        parameters: AlgorithmParameter[],
    ) => void;

    upsertProvider: (provider: ComputationProvider) => void;

    removeProvider: (providerId: number) => void;
}

export const useComputationCatalogStore = create<ComputationCatalogState>((set) => ({
    providers: [],
    algorithms: [],
    parameters: [],

    setCatalog: (providers, algorithms, parameters) => {
        set({ providers, algorithms, parameters });
    },

    setProviderAlgorithms: (providerId, algorithms, parameters) => {
        set((state) => ({
            algorithms: [
                ...state.algorithms.filter((a) => a.computationProviderId !== providerId),
                ...algorithms,
            ],
            parameters: [
                ...state.parameters.filter((p) => p.computationProviderId !== providerId),
                ...parameters,
            ],
        }));
    },

    upsertProvider: (provider) => {
        set((state) => {
            const exists = state.providers.some((p) => p.id === provider.id);
            return {
                providers: exists
                    ? state.providers.map((p) => (p.id === provider.id ? provider : p))
                    : [...state.providers, provider],
            };
        });
    },

    removeProvider: (providerId) => {
        set((state) => ({
            providers: state.providers.filter((p) => p.id !== providerId),
            algorithms: state.algorithms.filter((a) => a.computationProviderId !== providerId),
            parameters: state.parameters.filter((p) => p.computationProviderId !== providerId),
        }));
    },
}));

export async function loadComputationCatalog(): Promise<void> {
    const [providers, algorithms, parameters] = await Promise.all([
        getAllComputationProviders(),
        getAllComputationAlgorithms(),
        getAllAlgorithmParameters(),
    ]);
    useComputationCatalogStore.getState().setCatalog(providers, algorithms, parameters);
}
