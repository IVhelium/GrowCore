import { useRef, useState } from "react";
import { getApiError } from './../../utils/getApiError';
import UserAvatar from "./UserAvatar";
import Button from "../common/Button";
import { ImageUp, Trash2 } from "lucide-react";


export default function AvatarEditor({
    user,
    onUpload,
    onDelete
}) {
    const inputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleFileChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        setError("");
        setIsLoading(true);

        try {
            await onUpload?.(file);
        } catch (requestError) {
            setError(getApiError(requestError, "Unable to upload avatar"));
        } finally {
            setIsLoading(false);
            event.target.value = "";
        }
    }

    async function handleDelete() {
        setError("");
        setIsLoading(true);

        try {
            await onDelete?.();
        } catch (requestError) {
            setError(getApiError(requestError, "Unable to delete avatar"));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Avatar</h2>

            <div className="mt-5 flex items-center gap-4">
                <UserAvatar user={user} size="lg"/>
                <div className="flex flex-wrap gap-2">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <Button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={isLoading}
                    >
                        <ImageUp size={17}/> Upload
                    </Button>

                    {user?.avatar_url && (
                        <Button
                            type="button"
                            style="danger"
                            onClick={handleDelete}
                            disabled={isLoading}
                        >
                            <Trash2 size={17}/> Remove
                        </Button>
                    )}
                </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">JPEG, PNG or WEBP. Maximum file size: 3 MB</p>
            {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </div>
    );
}