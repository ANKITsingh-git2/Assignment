import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JobList from '@/components/JobList';
import CreateJob from '@/components/CreateJob';
import ProfileSetup from '@/components/ProfileSetup';
import ApplicationsList from '@/components/ApplicationsList';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          manufacturer_details(*),
          gig_worker_details(*)
        `)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch profile',
          variant: 'destructive',
        });
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const needsProfileSetup = !profile?.manufacturer_details?.length && !profile?.gig_worker_details?.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">GigWork Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.name}
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {needsProfileSetup ? (
          <ProfileSetup profile={profile} onProfileUpdated={fetchProfile} />
        ) : (
          <Tabs defaultValue={profile?.user_type === 'manufacturer' ? 'my-jobs' : 'available-jobs'}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="available-jobs">Available Jobs</TabsTrigger>
              <TabsTrigger value="my-applications">My Applications</TabsTrigger>
              {profile?.user_type === 'manufacturer' && (
                <>
                  <TabsTrigger value="my-jobs">My Jobs</TabsTrigger>
                  <TabsTrigger value="create-job">Post Job</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="available-jobs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Available Jobs</CardTitle>
                  <CardDescription>Browse and apply to available job postings</CardDescription>
                </CardHeader>
                <CardContent>
                  <JobList userProfile={profile} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my-applications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>My Applications</CardTitle>
                  <CardDescription>Track your job applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <ApplicationsList userProfile={profile} />
                </CardContent>
              </Card>
            </TabsContent>

            {profile?.user_type === 'manufacturer' && (
              <>
                <TabsContent value="my-jobs" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Job Postings</CardTitle>
                      <CardDescription>Manage your job postings and applications</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <JobList userProfile={profile} showMyJobs />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="create-job" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Post a New Job</CardTitle>
                      <CardDescription>Create a job posting to find skilled workers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CreateJob manufacturerProfile={profile} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Dashboard;