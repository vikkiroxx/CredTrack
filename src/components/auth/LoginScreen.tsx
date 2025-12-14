import { useAuth } from '../../context/AuthContext';
import { Shield, Globe } from 'lucide-react';

export function LoginScreen() {
    const { signInWithGoogle } = useAuth();

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-8 animate-in zoom-in duration-500">
                <h1 className="text-4xl font-bold text-primary tracking-tight mb-2">CredTrack</h1>
                <p className="text-muted-foreground text-lg">Your Personal Finance Companion</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-8 shadow-xl w-full max-w-sm space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-left">
                        <div className="bg-primary/20 p-2 rounded-full">
                            <Globe className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold">Sync Everywhere</h3>
                            <p className="text-xs text-muted-foreground">Access your data on any device</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-left">
                        <div className="bg-primary/20 p-2 rounded-full">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold">Secure Backup</h3>
                            <p className="text-xs text-muted-foreground">Never lose your financial history</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={signInWithGoogle}
                    className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors shadow-sm"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                    Sign in with Google
                </button>
            </div>

            <p className="mt-8 text-xs text-muted-foreground">
                By signing in, you agree to our Terms & Privacy Policy.
            </p>
        </div>
    );
}
