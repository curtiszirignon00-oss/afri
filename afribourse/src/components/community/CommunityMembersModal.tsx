// src/components/community/CommunityMembersModal.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Users, Crown, Shield, Loader2, UserMinus, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    useCommunityMembers,
    usePendingJoinRequests,
    useProcessJoinRequest,
    useUpdateMemberRole,
    useRemoveMember,
    type CommunityMemberRole,
} from '../../hooks/useCommunity';

interface Props {
    communityId: string;
    canManage: boolean;
    onClose: () => void;
}

export default function CommunityMembersModal({ communityId, canManage, onClose }: Props) {
    const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');
    const [page, setPage] = useState(1);
    const [selectedMember, setSelectedMember] = useState<string | null>(null);

    const { data: membersData, isLoading: membersLoading } = useCommunityMembers(communityId, page);
    const { data: requestsData, isLoading: requestsLoading } = usePendingJoinRequests(communityId, 1);

    const processRequest = useProcessJoinRequest();
    const updateRole = useUpdateMemberRole();
    const removeMember = useRemoveMember();

    const members = membersData?.data || [];
    const totalPages = membersData?.totalPages || 1;
    const requests = requestsData?.data || [];
    const pendingCount = requestsData?.total || 0;

    const handleApprove = async (requestId: string) => {
        try {
            await processRequest.mutateAsync({ requestId, action: 'approve' });
            toast.success('Membre approuve');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur');
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await processRequest.mutateAsync({ requestId, action: 'reject' });
            toast.success('Demande rejetee');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur');
        }
    };

    const handleUpdateRole = async (memberId: string, role: CommunityMemberRole) => {
        try {
            await updateRole.mutateAsync({ communityId, memberId, role });
            toast.success('Role mis a jour');
            setSelectedMember(null);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Etes-vous sur de vouloir retirer ce membre?')) return;

        try {
            await removeMember.mutateAsync({ communityId, memberId });
            toast.success('Membre retire');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur');
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'OWNER':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                        <Crown className="w-3 h-3" />
                        Proprietaire
                    </span>
                );
            case 'ADMIN':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                        <Shield className="w-3 h-3" />
                        Admin
                    </span>
                );
            case 'MODERATOR':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        <Shield className="w-3 h-3" />
                        Modo
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">Membres</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                {canManage && (
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`flex-1 py-3 font-medium text-sm ${
                                activeTab === 'members'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-500'
                            }`}
                        >
                            Membres
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`flex-1 py-3 font-medium text-sm relative ${
                                activeTab === 'requests'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-500'
                            }`}
                        >
                            Demandes
                            {pendingCount > 0 && (
                                <span className="absolute top-2 right-1/4 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="overflow-y-auto max-h-[60vh]">
                    {/* Members Tab */}
                    {activeTab === 'members' && (
                        <>
                            {membersLoading && (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                                </div>
                            )}

                            {!membersLoading && members.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    Aucun membre
                                </div>
                            )}

                            {!membersLoading && members.length > 0 && (
                                <div className="divide-y">
                                    {members.map((member: any) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center gap-3 p-4 hover:bg-gray-50"
                                        >
                                            <Link
                                                to={`/profile/${member.user.id}`}
                                                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden"
                                            >
                                                {member.user.profile?.avatar_url ? (
                                                    <img
                                                        src={member.user.profile.avatar_url}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Users className="w-5 h-5 text-gray-400" />
                                                )}
                                            </Link>

                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    to={`/profile/${member.user.id}`}
                                                    className="font-medium text-gray-900 hover:underline truncate block"
                                                >
                                                    {member.user.name} {member.user.lastname}
                                                </Link>
                                                {member.user.profile?.username && (
                                                    <p className="text-sm text-gray-500 truncate">
                                                        @{member.user.profile.username}
                                                    </p>
                                                )}
                                            </div>

                                            {getRoleBadge(member.role)}

                                            {canManage && member.role !== 'OWNER' && (
                                                <div className="relative">
                                                    <button
                                                        onClick={() =>
                                                            setSelectedMember(
                                                                selectedMember === member.user.id
                                                                    ? null
                                                                    : member.user.id
                                                            )
                                                        }
                                                        className="p-1 hover:bg-gray-200 rounded"
                                                    >
                                                        <ChevronDown className="w-4 h-4" />
                                                    </button>

                                                    {selectedMember === member.user.id && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-10"
                                                                onClick={() => setSelectedMember(null)}
                                                            />
                                                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border z-20">
                                                                <button
                                                                    onClick={() =>
                                                                        handleUpdateRole(member.user.id, 'ADMIN')
                                                                    }
                                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                                                                >
                                                                    Promouvoir Admin
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleUpdateRole(member.user.id, 'MODERATOR')
                                                                    }
                                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                                                                >
                                                                    Promouvoir Modo
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleUpdateRole(member.user.id, 'MEMBER')
                                                                    }
                                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                                                                >
                                                                    Retrograder
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleRemoveMember(member.user.id)
                                                                    }
                                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                                                >
                                                                    <UserMinus className="w-4 h-4 inline mr-2" />
                                                                    Retirer
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center gap-2 p-4 border-t">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Prec
                                    </button>
                                    <span className="px-3 py-1 text-sm">
                                        {page}/{totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Suiv
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Requests Tab */}
                    {activeTab === 'requests' && (
                        <>
                            {requestsLoading && (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                                </div>
                            )}

                            {!requestsLoading && requests.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    Aucune demande en attente
                                </div>
                            )}

                            {!requestsLoading && requests.length > 0 && (
                                <div className="divide-y">
                                    {requests.map((request: any) => (
                                        <div key={request.id} className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    to={`/profile/${request.user.id}`}
                                                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden"
                                                >
                                                    {request.user.profile?.avatar_url ? (
                                                        <img
                                                            src={request.user.profile.avatar_url}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Users className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </Link>

                                                <div className="flex-1">
                                                    <Link
                                                        to={`/profile/${request.user.id}`}
                                                        className="font-medium text-gray-900 hover:underline"
                                                    >
                                                        {request.user.name} {request.user.lastname}
                                                    </Link>
                                                    {request.user.profile?.level && (
                                                        <p className="text-sm text-gray-500">
                                                            Niveau {request.user.profile.level}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {request.message && (
                                                <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                    {request.message}
                                                </p>
                                            )}

                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={() => handleApprove(request.id)}
                                                    disabled={processRequest.isPending}
                                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                                                >
                                                    Approuver
                                                </button>
                                                <button
                                                    onClick={() => handleReject(request.id)}
                                                    disabled={processRequest.isPending}
                                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm"
                                                >
                                                    Refuser
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
