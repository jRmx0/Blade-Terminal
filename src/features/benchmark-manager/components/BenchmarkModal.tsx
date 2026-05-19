import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateCompliantEnvironment, validateGeneratorSystemParams } from "@/features/canvas-editing/utils/envGenerator";
import type { CoordSystemType, EnvFormat, EnvType } from "@/config/db-ops/enums";
import { APP_PARAMETER_HANDLER } from "@/config/computation/appParameterHandlers";
import {
    useBenchmarkModalStore,
    type BenchmarkEnvironmentSetSetup,
    type BenchmarkEnvironmentSetup,
    type BenchmarkGeneratedEnvironment,
} from "@/features/benchmark-manager/stores/benchmarkModalStore";
import { runBenchmark as runBenchmarkService } from "@/features/benchmark-manager/data/benchmarkRunnerService";
import { useComputationCatalogStore } from "@/stores/computationCatalogStore";
import { useModalLifecycle } from "@/hooks/modals/useModalLifecycle";
import ModalTitle from "@/components/modal/modal-title/ModalTitle";
import ModalFooterButton from "@/components/modal/modal-footer/ModalFooterButton";
import ModalActionBar, { type ModalActionBarItem } from "@/components/modal/modal-action-bar/ModalActionBar";
import type { ModalActionStatus } from "@/components/modal/modal-action-bar/ModalActionBarAction";
import BenchmarkSetupTab from "@/features/benchmark-manager/components/BenchmarkSetupTab";
import BenchmarkEnvSetupTab from "@/features/benchmark-manager/components/BenchmarkEnvSetupTab";
import BenchmarkRunTab from "@/features/benchmark-manager/components/BenchmarkRunTab";

const SYSTEM_ENV_HANDLERS = new Set([
    APP_PARAMETER_HANDLER.ENVIRONMENT_FORMAT,
    APP_PARAMETER_HANDLER.ENVIRONMENT_TYPE,
    APP_PARAMETER_HANDLER.ENVIRONMENT_COORDSYSTEM,
]);

export default function BenchmarkModal() {
    const {
        isOpen,
        close,
        selectedProviderId,
        selectedAlgorithmId,
        targetParameterSetup,
        fixedParameters,
        environmentSetup,
        environmentSetSetup,
        systemEnvironmentSetup,
        multipleRunsSetup,
        metricsConfig,
        isRunning,
        error,
        setIsRunning,
        setError,
        setSelectedProvider,
        setSelectedAlgorithm,
        setTargetParameterSetup,
        setFixedParameter,
        removeFixedParameter,
        setEnvironmentSetup,
        setEnvironmentSetSetup,
        setSystemEnvironmentSetup,
        setMultipleRunsSetup,
        toggleMetric,
        executionState,
        setBenchmarkExecutionState,
        addStepResult,
        resetResults,
        cancelBenchmark,
        reset,
        setGeneratedEnvironments,
    } = useBenchmarkModalStore();

    const { providers, algorithms, parameters: catalogParameters, metrics: catalogMetrics } = useComputationCatalogStore();
    const { handleBackdropMouseDown } = useModalLifecycle({
        isOpen,
        shortcutToken: "benchmark-modal",
        onClose: close,
    });

    const [activeTab, setActiveTab] = useState<"env-setup" | "setup" | "run">("env-setup");
    const [generateStatus, setGenerateStatus] = useState<ModalActionStatus | undefined>(undefined);
    const [generateStatusMessage, setGenerateStatusMessage] = useState<string | undefined>(undefined);

    // Filtered data
    const selectedProvider = useMemo(
        () => providers.find((p) => p.id === selectedProviderId),
        [providers, selectedProviderId],
    );

    const availableAlgorithms = useMemo(
        () => (selectedProviderId ? algorithms.filter((a) => a.computationProviderId === selectedProviderId) : []),
        [algorithms, selectedProviderId],
    );

    const selectedAlgorithm = useMemo(
        () => availableAlgorithms.find((a) => a.id === selectedAlgorithmId),
        [availableAlgorithms, selectedAlgorithmId],
    );

    const algorithmParameters = useMemo(
        () =>
            selectedAlgorithmId && selectedProviderId
                ? catalogParameters.filter(
                    (p) => p.algorithmId === selectedAlgorithmId && p.computationProviderId === selectedProviderId,
                )
                : [],
        [catalogParameters, selectedAlgorithmId, selectedProviderId],
    );

    const numericParameters = useMemo(
        () => algorithmParameters.filter((p) => p.paramType === "Integer" || p.paramType === "Decimal"),
        [algorithmParameters],
    );

    const algorithmMetrics = useMemo(
        () =>
            selectedAlgorithmId && selectedProviderId
                ? catalogMetrics.filter(
                    (m) => m.algorithmId === selectedAlgorithmId && m.computationProviderId === selectedProviderId,
                )
                : [],
        [catalogMetrics, selectedAlgorithmId, selectedProviderId],
    );

    const nonTargetParameters = useMemo(
        () => algorithmParameters.filter(
            (p) => p.id !== targetParameterSetup?.targetParamId && !SYSTEM_ENV_HANDLERS.has(p.appHandler ?? ""),
        ),
        [algorithmParameters, targetParameterSetup],
    );

    const selectedTargetParameter = useMemo(
        () => algorithmParameters.find((p) => p.id === targetParameterSetup?.targetParamId),
        [algorithmParameters, targetParameterSetup],
    );

    // Validation
    const isSetupValid = useMemo(() => {
        if (!selectedProvider || !selectedAlgorithm || !targetParameterSetup) return false;
        const { startValue, endValue, stepValue } = targetParameterSetup;
        const start = Number(startValue);
        const end = Number(endValue);
        const step = Number(stepValue);
        return !isNaN(start) && !isNaN(end) && !isNaN(step) && step > 0 && start <= end;
    }, [selectedProvider, selectedAlgorithm, targetParameterSetup]);

    const generatorSystemValidation = useMemo(() => validateGeneratorSystemParams({
        format: systemEnvironmentSetup.format as EnvFormat,
        coordSystem: systemEnvironmentSetup.coordinateSystem as CoordSystemType,
    }), [systemEnvironmentSetup.format, systemEnvironmentSetup.coordinateSystem]);

    // Reset tab when modal closes
    useEffect(() => {
        if (!isOpen) setActiveTab("env-setup");
    }, [isOpen]);

    const abortControllerRef = useRef<AbortController | null>(null);

    const handleStartBenchmark = useCallback(async () => {
        if (!selectedProvider || !selectedAlgorithm || !targetParameterSetup) {
            return;
        }

        if (!generatorSystemValidation.ok) {
            setError(generatorSystemValidation.error ?? "Unsupported system environment setup for benchmark generation.");
            return;
        }

        const start = Number(targetParameterSetup.startValue);
        const end = Number(targetParameterSetup.endValue);
        const step = Number(targetParameterSetup.stepValue);
        const estimatedStepCount =
            Number.isFinite(start) && Number.isFinite(end) && Number.isFinite(step) && step > 0
                ? Math.floor((end - start) / step) + 1
                : 0;
        const totalSteps = Math.max(estimatedStepCount, 0);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsRunning(true);
        setError(null);
        resetResults();

        setBenchmarkExecutionState({
            status: "running",
            progress: {
                totalSteps,
                completedSteps: 0,
                totalRuns: totalSteps * multipleRunsSetup.runsPerStep,
                completedRuns: 0,
            },
            results: [],
            abortSignal: controller.signal,
            error: undefined,
        });

        try {
            const results = await runBenchmarkService({
                provider: selectedProvider,
                algorithm: selectedAlgorithm,
                algorithmParameters,
                algorithmMetrics,
                targetParameterSetup,
                fixedParameters,
                environmentSetup,
                environmentSetSetup,
                systemEnvironmentSetup,
                multipleRunsSetup,
                selectedMetrics: metricsConfig.selectedMetrics,
                signal: controller.signal,
                onProgress: (progress) => setBenchmarkExecutionState({ progress }),
                onStepCompleted: (result) => addStepResult(result),
            });

            setBenchmarkExecutionState({
                status: controller.signal.aborted ? "cancelled" : "completed",
                results,
                abortSignal: undefined,
            });
        } catch (runError) {
            const message = runError instanceof Error ? runError.message : String(runError);

            if (controller.signal.aborted) {
                setBenchmarkExecutionState({ status: "cancelled", abortSignal: undefined });
            } else {
                setError(message);
                setBenchmarkExecutionState({
                    status: "error",
                    error: message,
                    abortSignal: undefined,
                });
            }
        } finally {
            setIsRunning(false);
            abortControllerRef.current = null;
        }
    }, [
        selectedProvider,
        selectedAlgorithm,
        targetParameterSetup,
        setIsRunning,
        setError,
        resetResults,
        setBenchmarkExecutionState,
        multipleRunsSetup.runsPerStep,
        algorithmParameters,
        algorithmMetrics,
        fixedParameters,
        environmentSetup,
        environmentSetSetup,
        systemEnvironmentSetup,
        multipleRunsSetup,
        metricsConfig.selectedMetrics,
        addStepResult,
        generatorSystemValidation.error,
        generatorSystemValidation.ok,
    ]);

    const handleCancelBenchmark = useCallback(() => {
        abortControllerRef.current?.abort();
        cancelBenchmark();
    }, [cancelBenchmark]);

    const handleCloseModal = useCallback(() => {
        abortControllerRef.current?.abort();
        reset();
    }, [reset]);

    const handleGenerateEnvironments = useCallback(() => {
        if (!generatorSystemValidation.ok) return;

        setGenerateStatus("loading");
        setGenerateStatusMessage(undefined);

        const systemParams = {
            format: systemEnvironmentSetup.format as EnvFormat,
            type: systemEnvironmentSetup.type as EnvType,
            coordSystem: systemEnvironmentSetup.coordinateSystem as CoordSystemType,
        };

        const generated: BenchmarkGeneratedEnvironment[] = [];
        const errors: string[] = [];

        for (let i = 0; i < environmentSetSetup.count; i++) {
            const derivedSeed = environmentSetSetup.baseSeed.trim()
                ? `${environmentSetSetup.baseSeed.trim()}-env-${i}`
                : "";

            const result = generateCompliantEnvironment({
                width: environmentSetup.width,
                height: environmentSetup.height,
                cellSize: environmentSetup.cellSize,
                obstacleRatio: environmentSetup.obstacleRatio,
                clusteringProb: environmentSetup.clusteringProb,
                seed: derivedSeed,
                systemParams,
            });

            if (result.ok) {
                generated.push({
                    index: i,
                    derivedSeed,
                    boundary: result.value.environment.boundary,
                    obstacles: result.value.environment.obstacles,
                    startEndPoint: result.value.environment.startEndPoint,
                    objectType: result.value.objectType,
                    usedSeedHex: result.value.environment.usedSeedHex,
                    usedClusteringPct: result.value.environment.usedClusteringPct,
                    usedObstacleRatioPct: result.value.environment.usedObstacleRatioPct,
                });
            } else {
                errors.push(`Env ${i + 1}: ${result.error}`);
            }
        }

        if (errors.length === 0) {
            setGeneratedEnvironments(generated);
            setGenerateStatus("success");
            setGenerateStatusMessage(
                `${generated.length} environment${generated.length !== 1 ? "s" : ""} generated.`,
            );
        } else {
            setGenerateStatus("error");
            setGenerateStatusMessage(errors.join("\n"));
        }
    }, [
        generatorSystemValidation.ok,
        environmentSetSetup.count,
        environmentSetSetup.baseSeed,
        environmentSetup.width,
        environmentSetup.height,
        environmentSetup.cellSize,
        environmentSetup.obstacleRatio,
        environmentSetup.clusteringProb,
        systemEnvironmentSetup.format,
        systemEnvironmentSetup.type,
        systemEnvironmentSetup.coordinateSystem,
        setGeneratedEnvironments,
    ]);

    const envSetupActions: ModalActionBarItem[] = [
        {
            id: "generate-env",
            icon: "auto_awesome",
            label: "Generate Env.",
            onClick: handleGenerateEnvironments,
            disabled: !generatorSystemValidation.ok || environmentSetSetup.count < 1,
            loading: generateStatus === "loading",
            status: generateStatus !== undefined && generateStatus !== "loading" ? generateStatus : undefined,
            statusMessage: generateStatusMessage,
        },
    ];

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 select-none"
            onMouseDown={handleBackdropMouseDown}
        >
            <div className="flex flex-col w-200 max-h-[85vh] bg-gray-100 rounded-lg shadow-xl overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-200 shrink-0">
                    <ModalTitle title="Benchmark" onClose={close} />
                </div>

                {/* Tab Bar */}
                <div className="flex shrink-0 border-b border-gray-300 bg-gray-100">
                    <button
                        type="button"
                        onClick={() => setActiveTab("env-setup")}
                        className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none border-b-2 -mb-px
                                ${activeTab === "env-setup"
                                ? "border-teal-600 text-teal-700"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        Env. Setup
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("setup")}
                        className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none border-b-2 -mb-px
                            ${activeTab === "setup"
                                ? "border-teal-600 text-teal-700"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        Setup
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("run")}
                        disabled={!isSetupValid}
                        className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none border-b-2 -mb-px
                            ${activeTab === "run"
                                ? "border-teal-600 text-teal-700"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            } ${!isSetupValid ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                        Run
                    </button>
                </div>

                {/* Env Setup Action Bar */}
                {activeTab === "env-setup" && (
                    <ModalActionBar actions={envSetupActions} />
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === "setup" && (
                        <BenchmarkSetupTab
                            providers={providers}
                            selectedProviderId={selectedProviderId}
                            onSelectProvider={setSelectedProvider}
                            availableAlgorithms={availableAlgorithms}
                            selectedAlgorithm={selectedAlgorithm}
                            onSelectAlgorithm={setSelectedAlgorithm}
                            numericParameters={numericParameters}
                            targetParameterSetup={targetParameterSetup}
                            onSetTargetParameter={setTargetParameterSetup}
                            nonTargetParameters={nonTargetParameters}
                            fixedParameters={fixedParameters}
                            onSetFixedParameter={setFixedParameter}
                            onRemoveFixedParameter={removeFixedParameter}
                            multipleRunsSetup={multipleRunsSetup}
                            onSetMultipleRunsSetup={setMultipleRunsSetup}
                            metricsConfig={metricsConfig}
                            onToggleMetric={toggleMetric}
                        />
                    )}
                    {activeTab === "env-setup" && (
                        <BenchmarkEnvSetupTab
                            environmentSetup={environmentSetup}
                            onSetEnvironmentSetup={setEnvironmentSetup}
                            environmentSetSetup={environmentSetSetup}
                            onSetEnvironmentSetSetup={setEnvironmentSetSetup}
                            systemEnvironmentSetup={systemEnvironmentSetup}
                            onSetSystemEnvironmentSetup={setSystemEnvironmentSetup}
                        />
                    )}
                    {activeTab === "run" && (
                        <BenchmarkRunTab
                            selectedProvider={selectedProvider}
                            selectedAlgorithm={selectedAlgorithm}
                            targetParameterSetup={targetParameterSetup}
                            targetParameterName={selectedTargetParameter?.name ?? "Parameter"}
                            fixedParameters={fixedParameters}
                            environmentSetup={environmentSetup}
                            systemEnvironmentSetup={systemEnvironmentSetup}
                            multipleRunsSetup={multipleRunsSetup}
                            metricsConfig={metricsConfig}
                            isRunning={isRunning}
                            error={error}
                            executionState={executionState}
                            onStartBenchmark={handleStartBenchmark}
                            onCancelBenchmark={handleCancelBenchmark}
                            canStartBenchmark={generatorSystemValidation.ok}
                            systemParamsError={generatorSystemValidation.error}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 shrink-0">
                    <ModalFooterButton onClick={handleCloseModal}>Close</ModalFooterButton>
                </div>
            </div>
        </div>
    );
}
