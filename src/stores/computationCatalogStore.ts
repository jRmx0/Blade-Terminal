import { create } from "zustand";
import { getAllComputationProviders } from "@server/db/computationProviders";
import { getAllComputationAlgorithms } from "@server/db/computationProviderAlgorithms";
import { getAllAlgorithmParameters } from "@server/db/computationAlgorithmParametersSetup";
import { getAllAppEnums } from "@server/db/appEnumSetup";
import { getAllLayers } from "@server/db/layersSetup";
import { getAllLayerSettingsSetup } from "@server/db/layerSettingsSetup";
import { useProviderLayerStore } from "@/stores/providerLayerStore";
import type { AlgorithmParameter, AppEnumValue, ComputationAlgorithm, ComputationProvider, ProviderLayerRecord } from "@/types/serviceTypes";
import type { LayerSettingsSetup } from "@/types/layerTypes";

interface ComputationCatalogState {
    providers: ComputationProvider[];
    algorithms: ComputationAlgorithm[];
    parameters: AlgorithmParameter[];
    appEnums: AppEnumValue[];
    layerSettingsSetup: LayerSettingsSetup[];

    setCatalog: (
        providers: ComputationProvider[],
        algorithms: ComputationAlgorithm[],
        parameters: AlgorithmParameter[],
        appEnums: AppEnumValue[],
        layerSettingsSetup: LayerSettingsSetup[],
    ) => void;

    setProviderAlgorithms: (
        providerId: number,
        algorithms: ComputationAlgorithm[],
        parameters: AlgorithmParameter[],
    ) => void;

    upsertProvider: (provider: ComputationProvider) => void;

    removeProvider: (providerId: number) => void;

    upsertAlgorithm: (algorithm: ComputationAlgorithm) => void;

    removeAlgorithm: (id: number, computationProviderId: number) => void;
    /** Replaces in-memory layerSettingsSetup entries for a given provider after a metadata fetch. */
    setProviderLayerSettingsSetup: (providerId: number, setups: LayerSettingsSetup[]) => void;
}

export const useComputationCatalogStore = create<ComputationCatalogState>((set) => ({
    providers: [],
    algorithms: [],
    parameters: [],
    appEnums: [],
    layerSettingsSetup: [],

    setCatalog: (providers, algorithms, parameters, appEnums, layerSettingsSetup) => {
        set({ providers, algorithms, parameters, appEnums, layerSettingsSetup });
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
            layerSettingsSetup: state.layerSettingsSetup.filter((s) => s.providerId !== providerId),
        }));
    },

    upsertAlgorithm: (algorithm) => {
        set((state) => {
            const exists = state.algorithms.some(
                (a) => a.id === algorithm.id && a.computationProviderId === algorithm.computationProviderId,
            );
            return {
                algorithms: exists
                    ? state.algorithms.map((a) =>
                        a.id === algorithm.id && a.computationProviderId === algorithm.computationProviderId
                            ? algorithm
                            : a,
                    )
                    : [...state.algorithms, algorithm],
            };
        });
    },

    removeAlgorithm: (id, computationProviderId) => {
        set((state) => ({
            algorithms: state.algorithms.filter(
                (a) => !(a.id === id && a.computationProviderId === computationProviderId),
            ),
            parameters: state.parameters.filter(
                (p) => !(p.algorithmId === id && p.computationProviderId === computationProviderId),
            ),
        }));
    },

    setProviderLayerSettingsSetup: (providerId, setups) => {
        set((state) => ({
            layerSettingsSetup: [
                ...state.layerSettingsSetup.filter((s) => s.providerId !== providerId),
                ...setups,
            ],
        }));
    },
}));

export async function loadComputationCatalog(): Promise<void> {
    const [providers, algorithms, parameters, appEnums, layerSettingsSetupData, allLayers] = await Promise.all([
        getAllComputationProviders(),
        getAllComputationAlgorithms(),
        getAllAlgorithmParameters(),
        getAllAppEnums(),
        getAllLayerSettingsSetup(),
        getAllLayers(),
    ]);
    useComputationCatalogStore.getState().setCatalog(providers, algorithms, parameters, appEnums, layerSettingsSetupData);

    // Hydrate providerLayerStore from persisted layersSetup records.
    // System layers have algorithmId === 0 and are skipped.
    const providerLayersByAlgorithm = new Map<string, ProviderLayerRecord[]>();
    for (const layer of allLayers) {
        if (!layer.algorithmId || !layer.providerId) continue;
        const key = `${layer.providerId}-${layer.algorithmId}`;
        const stub: ProviderLayerRecord = {
            id: layer.id,
            algorithmId: layer.algorithmId,
            providerId: layer.providerId,
            computeLayer: layer.label,
            name: layer.label,
            layerType: (layer.type as ProviderLayerRecord["layerType"]) ?? "polygon",
            universalStyleAttributes: [],
            pointStyleAttributes: [],
            lineStyleAttributes: [],
            polygonStyleAttributes: [],
            pointLabelColorMapping: [],
            pointLabelEnumValues: [],
        };
        const group = providerLayersByAlgorithm.get(key);
        if (group) group.push(stub);
        else providerLayersByAlgorithm.set(key, [stub]);
    }
    for (const layers of providerLayersByAlgorithm.values()) {
        const first = layers[0];
        if (first) {
            useProviderLayerStore.getState().setProviderLayers(first.providerId, first.algorithmId, layers);
        }
    }
}
