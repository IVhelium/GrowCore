import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './../hooks/useAuth';
import Container from '../components/common/Container';
import PageHeader from './../components/common/PageHader';
import UserProfileCard from '../components/user/UserProfileCard';
import AvatarEditor from '../components/user/AvatarEditor';
import ProfileForm from '../components/user/ProfileForm';
import RoleQuickLinks from '../components/user/RoleQuickLinks';

export default function ProfilePage() {
    const { user, logout, updateProfile, uploadAvatar, deleteAvatar, reloadUser } = useAuth();
    const navigate = useNavigate();
    const [pendingAvatarFile, setPendingAvatarFile] = useState(null);

    useEffect(() => {
        reloadUser();
    }, [reloadUser]);

    async function handleLogout() {
        await logout();
        navigate("/");
    }

    async function saveProfileChanges(payload) {
        await updateProfile(payload);

        if (pendingAvatarFile) {
            await uploadAvatar(pendingAvatarFile);
            setPendingAvatarFile(null);
        }
    }

    return (
        <main>
            <Container className="py-8">
                <PageHeader
                    pretitle="Profile"
                    title="Account dashboard"
                    text="Update your GrowCore profile and avatar"
                />

                <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
                    <UserProfileCard user={user} onLogout={handleLogout}/>

                    <div className="grid gap-6">
                        <AvatarEditor
                            user={user}
                            selectedFile={pendingAvatarFile}
                            onSelect={setPendingAvatarFile}
                            onDelete={deleteAvatar}
                        />
                        <ProfileForm
                            key={user?.id || "empty-profile"}
                            user={user}
                            onSave={saveProfileChanges}
                            hasPendingAvatar={Boolean(pendingAvatarFile)}
                        />

                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <RoleQuickLinks user={user} />
                        </section>
                    </div>
                </div>
            </Container>
        </main>
    );
}
