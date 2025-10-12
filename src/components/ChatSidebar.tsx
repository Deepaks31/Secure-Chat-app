import { useEffect, useState } from "react";
import { User, Circle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { clearPrivateKey } from "@/utils/encryption";

interface Profile {
  id: string;
  username: string;
  email: string;
  public_key: string;
  is_online: boolean;
}

interface ChatSidebarProps {
  currentUserId: string;
  onSelectContact: (contact: Profile) => void;
  selectedContactId: string | null;
}

const ChatSidebar = ({ currentUserId, onSelectContact, selectedContactId }: ChatSidebarProps) => {
  const [contacts, setContacts] = useState<Profile[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadContacts();
    
    // Subscribe to profile changes for real-time online status
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          loadContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const loadContacts = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .order('username');

    if (error) {
      toast({
        title: "Error loading contacts",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setContacts(data || []);
  };

  const handleLogout = async () => {
    // Update online status
    await supabase
      .from('profiles')
      .update({ is_online: false })
      .eq('id', currentUserId);

    // Clear private key
    clearPrivateKey();

    // Sign out
    await supabase.auth.signOut();
    
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    
    navigate("/");
  };

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-sidebar-foreground">Contacts</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {contacts.length === 0 ? (
            <div className="text-center text-sidebar-foreground/60 py-8">
              No contacts yet
            </div>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedContactId === contact.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    {contact.is_online && (
                      <Circle className="w-3 h-3 fill-secondary text-secondary absolute bottom-0 right-0" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{contact.username}</div>
                    <div className="text-sm text-sidebar-foreground/60 truncate">
                      {contact.email}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;