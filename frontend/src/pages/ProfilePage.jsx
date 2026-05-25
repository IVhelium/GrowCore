
import { useNavigate } from 'react-router-dom';
import { useAuth } from './../hooks/useAuth';
import Container from '../components/common/Container';
import PageHeader from './../components/common/PageHader';
import UserProfileCard from '../components/user/UserProfileCard';
import AvatarEditor from '../components/user/AvatarEditor';
import ProfileForm from '../components/user/ProfileForm';

export default function ProfilePage() {
    const { user, logout, updateProfile, uploadAvatar, deleteAvatar } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/");
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
                        <AvatarEditor user={user} onUpload={uploadAvatar} onDelete={deleteAvatar}/>
                        <ProfileForm user={user} onSave={updateProfile}/>
                    </div>
                </div>
            </Container>
        </main>
    );
}