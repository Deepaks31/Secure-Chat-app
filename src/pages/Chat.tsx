import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ChatSidebar from "@/components/ChatSidebar";
import ChatArea from "@/components/ChatArea";
import { getPrivateKey } from "@/utils/encryption";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
  email: string;
  public_key: string;
  is_online: boolean;
}

const Chat = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/login");
      return;
    }

    // Check if private key exists
    const privateKey = getPrivateKey();
    if (!privateKey) {
      toast({
        title: "Missing encryption key",
        description: "Please sign up again to generate new encryption keys.",
        variant: "destructive",
      });
      await supabase.auth.signOut();
      navigate("/signup");
      return;
    }

    setCurrentUser(session.user);

    // Update online status
    await supabase
      .from('profiles')
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq('id', session.user.id);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
      // Update offline status on unmount
      supabase
        .from('profiles')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('id', session.user.id);
    };
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatSidebar
        currentUserId={currentUser.id}
        onSelectContact={setSelectedContact}
        selectedContactId={selectedContact?.id || null}
      />
      <ChatArea
        currentUserId={currentUser.id}
        selectedContact={selectedContact}
      />
    </div>
  );
};

export default Chat;