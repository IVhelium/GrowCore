import { useEffect, useState } from "react";
import { resolveMediaUrl } from "../../api/apiClient";
import { User } from "lucide-react";


const sizes = {
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-20 w-20"
}

export default function UserAvatar({
    user,
    size = "md",
    className = ""
}) {
    const [imageFailed, setImageFailed] = useState(false);
    const src = resolveMediaUrl(user?.avatar_url);

    useEffect(() => {
        const init = async () => {
          setImageFailed(false);
        };
        
        init();
    }, [src]);

    if (src && !imageFailed) {
        return (
            <img
                src={src}
                alt={`${user?.username || "User"} avatar`}
                onError={() => setImageFailed(true)}
                className={`${sizes[size]} rounded-lg object-cover ${className}`}
            />
        );
    }

    return (
      <span
        className={`${sizes[size]} grid place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B] ${className}`}
      >
        <User size={size === "lg" ? 34 : 20}/>
      </span>
    );
}