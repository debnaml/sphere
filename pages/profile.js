import PageHeading from '../components/PageHeading';

export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <PageHeading>Your Profile</PageHeading>
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm text-gray-600">Profile settings and account preferences will live here.</p>
      </div>
    </div>
  );
}
