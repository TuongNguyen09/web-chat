// ============================================================================
// USE GROUP OPERATIONS HOOK
// ============================================================================

import { useCallback } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
    addUserToGroup,
    updateChat,
    removeFromGroup,
    deleteChat,
} from "../redux/chat/action";
import { logger } from "../utils/logger";

const useGroupOperations = (currentChat, currentUserId, isAuthenticated) => {
    const dispatch = useDispatch();

    const handleRenameGroup = useCallback(
        async (nextName) => {
            const trimmed = nextName?.trim();
            if (!currentChat?.id || !trimmed || !isAuthenticated) return;
            try {
                await dispatch(
                    updateChat({
                        chatId: currentChat.id,
                        data: { newName: trimmed },
                    })
                );
                toast.success("Đổi tên nhóm thành công");
            } catch (err) {
                toast.error(err.message || "Đổi tên nhóm thất bại");
                logger.error("handleRenameGroup", err, { chatId: currentChat?.id });
            }
        },
        [currentChat?.id, isAuthenticated, dispatch]
    );

    const handleAddMember = useCallback(
        async (userId) => {
            if (!currentChat?.id || !userId || !isAuthenticated) {
                toast.error("Không tìm thấy người cần thêm");
                return;
            }
            try {
                await dispatch(addUserToGroup({ chatId: currentChat.id, userId }));
                toast.success("Đã thêm thành viên");
            } catch (err) {
                toast.error(err.message || "Không thể thêm thành viên");
                logger.error("handleAddMember", err, {
                    chatId: currentChat?.id,
                    userId,
                });
            }
        },
        [currentChat?.id, isAuthenticated, dispatch]
    );

    const handleRemoveMember = useCallback(
        async (memberId, onMemberRemoved) => {
            if (!currentChat?.id || !memberId || !isAuthenticated) return;
            try {
                await dispatch(
                    removeFromGroup({ chatId: currentChat.id, targetUserId: memberId })
                );
                const message =
                    memberId === currentUserId ? "Bạn đã rời nhóm" : "Đã xóa thành viên";
                toast.success(message);

                if (onMemberRemoved) {
                    onMemberRemoved(memberId);
                }
            } catch (err) {
                toast.error(err.message || "Không thể xóa thành viên");
                logger.error("handleRemoveMember", err, {
                    chatId: currentChat?.id,
                    memberId,
                });
            }
        },
        [currentChat?.id, currentUserId, isAuthenticated, dispatch]
    );

    const handleLeaveGroup = useCallback(
        (onGroupLeft) => {
            handleRemoveMember(currentUserId, onGroupLeft);
        },
        [currentUserId, handleRemoveMember]
    );

    const handleDeleteGroup = useCallback(
        async (onGroupDeleted) => {
            if (!currentChat?.id || !isAuthenticated) return;
            try {
                await dispatch(deleteChat({ chatId: currentChat.id }));
                toast.success("Đã xóa nhóm");
                if (onGroupDeleted) {
                    onGroupDeleted();
                }
            } catch (err) {
                toast.error(err.message || "Không thể xóa nhóm");
                logger.error("handleDeleteGroup", err, { chatId: currentChat?.id });
            }
        },
        [currentChat?.id, isAuthenticated, dispatch]
    );

    return {
        handleRenameGroup,
        handleAddMember,
        handleRemoveMember,
        handleLeaveGroup,
        handleDeleteGroup,
    };
};

export default useGroupOperations;
