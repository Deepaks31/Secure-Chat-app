import { useEffect, useState, useRef } from "react";
import { Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { encryptMessage, decryptMessage, getPrivateKey } from "@/utils/encryption";

interface Profile {
  id: string;
  username: string;
  email: string;
  public_key: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  encrypted_content: string;
  timestamp: string;
  decrypted?: string;
}

interface ChatAreaProps {
  currentUserId: string;
  selectedContact: Profile | null;
}

const ChatArea = ({ currentUserId, selectedContact }: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedContact) {
      loadMessages();
      subscribeToMessages();
    }
  }, [selectedContact?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!selectedContact) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${currentUserId})`)
      .order('timestamp', { ascending: true });

    if (error) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Decrypt messages
    const decryptedMessages = await Promise.all(
      (data || []).map(async (msg) => {
        try {
          const privateKey = getPrivateKey();
          if (!privateKey) return { ...msg, decrypted: "[Encrypted]" };
          
          const decrypted = await decryptMessage(msg.encrypted_content, privateKey);
          return { ...msg, decrypted };
        } catch (error) {
          return { ...msg, decrypted: "[Failed to decrypt]" };
        }
      })
    );

    setMessages(decryptedMessages);
  };

  const subscribeToMessages = () => {
    if (!selectedContact) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${selectedContact.id},receiver_id=eq.${currentUserId}`
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          try {
            const privateKey = getPrivateKey();
            if (!privateKey) return;
            
            const decrypted = await decryptMessage(newMsg.encrypted_content, privateKey);
            setMessages((prev) => [...prev, { ...newMsg, decrypted }]);
          } catch (error) {
            setMessages((prev) => [...prev, { ...newMsg, decrypted: "[Failed to decrypt]" }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || loading) return;

    setLoading(true);

    try {
      // Encrypt message with recipient's public key
      const encryptedContent = await encryptMessage(newMessage, selectedContact.public_key);

      const { error } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: selectedContact.id,
        encrypted_content: encryptedContent,
      });

      if (error) throw error;

      // Add to local state
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender_id: currentUserId,
          receiver_id: selectedContact.id,
          encrypted_content: encryptedContent,
          timestamp: new Date().toISOString(),
          decrypted: newMessage,
        },
      ]);

      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedContact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">Select a contact to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold">{selectedContact.username}</div>
            <div className="text-sm text-muted-foreground">{selectedContact.email}</div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isSent = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isSent ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isSent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="break-words">{message.decrypted || message.encrypted_content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type an encrypted message..."
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;