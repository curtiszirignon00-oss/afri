// src/components/community/CommunityTaskListBlock.tsx
import { useTaskChecks, useToggleTaskCheck, type TaskItem, type TaskCheckMap } from '../../hooks/useCommunity';
import { useAuth } from '../../contexts/AuthContext';
import { CheckSquare, Square, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
    postId: string;
    tasks: TaskItem[];
    canModerate?: boolean;
}

export default function CommunityTaskListBlock({ postId, tasks }: Props) {
    const { isLoggedIn } = useAuth();
    const { data: checks = {} as TaskCheckMap, isLoading } = useTaskChecks(postId);
    const toggleCheck = useToggleTaskCheck(postId);

    const handleToggle = async (taskId: string) => {
        if (!isLoggedIn) {
            toast.error('Connectez-vous pour cocher une tâche');
            return;
        }
        try {
            await toggleCheck.mutateAsync(taskId);
        } catch {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const sorted = [...tasks].sort((a, b) => a.order - b.order);
    const totalChecked = sorted.filter((t) => checks[t.id]?.checkedByMe).length;

    return (
        <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden">
            {/* Progress bar */}
            <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span className="font-medium text-gray-700">
                        {totalChecked}/{sorted.length} tâches cochées
                    </span>
                    {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: sorted.length ? `${(totalChecked / sorted.length) * 100}%` : '0%' }}
                    />
                </div>
            </div>

            {/* Task items */}
            <ul className="divide-y divide-gray-50">
                {sorted.map((task) => {
                    const check = checks[task.id];
                    const checkedByMe = check?.checkedByMe ?? false;
                    const count = check?.count ?? 0;

                    return (
                        <li key={task.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                            <button
                                onClick={() => handleToggle(task.id)}
                                disabled={toggleCheck.isPending}
                                className="flex-shrink-0 transition-colors"
                                aria-label={checkedByMe ? 'Décocher' : 'Cocher'}
                            >
                                {checkedByMe ? (
                                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                                ) : (
                                    <Square className="w-5 h-5 text-gray-300 hover:text-indigo-400" />
                                )}
                            </button>

                            <span className={`flex-1 text-sm ${checkedByMe ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {task.text}
                            </span>

                            {count > 0 && (
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                    {count} ✓
                                </span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
