import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Copy, KeyRound, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  codeEmail,
  codePassword,
  forgetCode,
  formatCode,
  generateCode,
  isValidCode,
  normalizeCode,
  rememberCode,
  storedCode,
} from "@/lib/account";
import { haptic } from "@/lib/gym";

type AccountCtx = {
  userId: string;
  code: string | null;
  signOut: () => Promise<void>;
};

const AccountContext = createContext<AccountCtx | null>(null);

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside AuthGate");
  return ctx;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setCode(storedCode());
      setChecked(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setCode(storedCode());
      setChecked(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userId) return <AuthScreen />;

  return (
    <AccountContext.Provider
      value={{
        userId,
        code,
        signOut: async () => {
          await supabase.auth.signOut();
          forgetCode();
        },
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<"choose" | "signin" | "created">("choose");
  const [newCode, setNewCode] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createAccount = async () => {
    haptic();
    setBusy(true);
    setError(null);
    const code = generateCode();
    const { error: err } = await supabase.auth.signUp({
      email: codeEmail(code),
      password: codePassword(code),
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    rememberCode(code);
    setNewCode(code);
    setMode("created");
  };

  const signIn = async () => {
    haptic();
    const code = normalizeCode(input);
    if (!isValidCode(code)) {
      setError("Enter your full 12-character code.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: codeEmail(code),
      password: codePassword(code),
    });
    setBusy(false);
    if (err) {
      setError("No account found for that code.");
      return;
    }
    rememberCode(code);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Gym Memory</p>
      <h1 className="mt-3 text-[34px] font-semibold leading-tight tracking-tight">
        {mode === "created" ? "Save your code" : "Your training, everywhere"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "created"
          ? "This 12-character code is your account. It's the only way back in — store it somewhere safe."
          : "One code is your whole account. No email, no password."}
      </p>

      {mode === "created" ? (
        <div className="mt-8 grid gap-3">
          <div className="glass glow rounded-[26px] p-6 text-center">
            <div className="tabnum text-[26px] font-semibold tracking-[0.14em]">
              {formatCode(newCode)}
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              haptic();
              await navigator.clipboard?.writeText(newCode);
              setCopied(true);
            }}
            className="press glass-soft flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium active:scale-[0.98]"
          >
            <Copy className="size-4" strokeWidth={1.75} />
            {copied ? "Copied" : "Copy code"}
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="press rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
          >
            I saved it — continue
          </button>
        </div>
      ) : mode === "signin" ? (
        <div className="mt-8 grid gap-3">
          <input
            value={input}
            onChange={(e) => setInput(normalizeCode(e.target.value))}
            placeholder="ABCD EFGH JKMN"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="glass-soft tabnum w-full rounded-2xl px-5 py-4 text-center text-lg tracking-[0.18em] outline-none placeholder:text-muted-foreground/50"
          />
          {error && <p className="px-1 text-xs text-destructive">{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={signIn}
            className="press flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" strokeWidth={1.75} />}
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("choose");
              setError(null);
            }}
            className="press py-2 text-sm text-muted-foreground active:scale-95"
          >
            Back
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={createAccount}
            className="press flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" strokeWidth={1.75} />}
            Generate my code
          </button>
          <button
            type="button"
            onClick={() => {
              haptic();
              setMode("signin");
            }}
            className="press glass-soft flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium active:scale-[0.98]"
          >
            <KeyRound className="size-4" strokeWidth={1.75} />
            I already have a code
          </button>
          {error && <p className="px-1 text-xs text-destructive">{error}</p>}
        </div>
      )}
    </main>
  );
}
