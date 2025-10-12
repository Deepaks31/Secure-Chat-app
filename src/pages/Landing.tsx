import { Shield, Lock, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      {/* Hero Section */}
      <header className="container mx-auto px-4 pt-20 pb-16 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-2xl bg-primary/10 backdrop-blur">
            <Shield className="w-16 h-16 text-primary" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          SecureChat
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          End-to-end encrypted messaging. Your conversations, completely private.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate("/signup")}
            className="bg-primary hover:bg-primary-glow text-lg px-8"
          >
            Get Started
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate("/login")}
            className="text-lg px-8 border-primary text-primary hover:bg-primary/10"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="p-3 w-fit rounded-lg bg-primary/10 mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">End-to-End Encryption</h3>
            <p className="text-muted-foreground">
              Messages are encrypted on your device and only you and your recipient can read them. Not even we can access your conversations.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="p-3 w-fit rounded-lg bg-secondary/10 mb-4">
              <MessageSquare className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Real-Time Messaging</h3>
            <p className="text-muted-foreground">
              Experience instant message delivery with WebSocket technology. Chat in real-time with online/offline status indicators.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="p-3 w-fit rounded-lg bg-accent/10 mb-4">
              <Users className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Secure by Design</h3>
            <p className="text-muted-foreground">
              Your private keys never leave your device. We use RSA-2048 encryption to ensure maximum security for your communications.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t border-border mt-16">
        <p>© 2025 SecureChat. Your privacy is our priority.</p>
      </footer>
    </div>
  );
};

export default Landing;