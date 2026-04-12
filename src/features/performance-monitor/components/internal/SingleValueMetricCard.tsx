interface SingleValueMetricCardProps {
    name: string;
    value: number | null;
}

export default function SingleValueMetricCard({ name, value }: SingleValueMetricCardProps) {
    return (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-b-0">
            <span className="text-sm text-gray-600 select-none">{name}</span>
            <span className="text-sm font-mono font-medium text-gray-900">
                {value !== null ? value : "—"}
            </span>
        </div>
    );
}
