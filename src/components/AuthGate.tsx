import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Copy, KeyRound, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  codeEmail,
  codePassword,
  forgetCode,
  formatCode,
  generateCode,
  isCodeUnsaved,
  isValidCode,
  markCodeSaved,
  markCodeUnsaved,
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
  const [needsReveal, setNeedsReveal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const refresh = (id: string | null) => {
      setUserId(id);
      setCode(storedCode());
      setNeedsReveal(isCodeUnsaved());
      setChecked(true);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      refresh(session?.user?.id ?? null),
    );
    supabase.auth.getSession().then(({ data }) => refresh(data.session?.user?.id ?? null));
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

  if (needsReveal && code) {
    return (
      <RevealScreen
        code={code}
        onDone={() => {
          markCodeSaved();
          setNeedsReveal(false);
          navigate({ to: "/" });
        }}
      />
    );
  }

  return (
    <AccountContext.Provider
      value={{
        userId,
        code,
        signOut: async () => {
          await supabase.auth.signOut();
          forgetCode();
          localStorage.removeItem("ascend_gym_state");
          navigate({ to: "/" });
        },
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        haptic();
        await navigator.clipboard?.writeText(code);
        setCopied(true);
      }}
      className="press glass-soft flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium active:scale-[0.98]"
    >
      <Copy className="size-4" strokeWidth={1.75} />
      {copied ? "Copied" : "Copy code"}
    </button>
  );
}

function RevealScreen({ code, onDone }: { code: string; onDone: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Ascend</p>
      <h1 className="mt-3 text-[34px] font-semibold leading-tight tracking-tight">Save your code</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        These 12 characters are your account. It's the only way to sign in on another device — store
        it somewhere safe.
      </p>
      <div className="mt-8 grid gap-3">
        <div className="glass glow rounded-[26px] p-6 text-center">
          <div className="tabnum text-[26px] font-semibold tracking-[0.14em]">{formatCode(code)}</div>
        </div>
        <CopyButton code={code} />
        <button
          type="button"
          onClick={() => {
            haptic();
            onDone();
          }}
          className="press rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
        >
          I saved it — continue
        </button>
      </div>
    </main>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<"choose" | "signin">("choose");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const createAccount = async () => {
    haptic();
    setBusy(true);
    setError(null);
    const code = generateCode();
    rememberCode(code);
    markCodeUnsaved();
    const { error: err } = await supabase.auth.signUp({
      email: codeEmail(code),
      password: codePassword(code),
    });
    if (err) {
      markCodeSaved();
      setBusy(false);
      setError(err.message);
    }
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
    if (err) {
      setBusy(false);
      setError("No account found for that code.");
      return;
    }
    rememberCode(code);
    navigate({ to: "/" });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Ascend</p>
      <h1 className="mt-3 text-[34px] font-semibold leading-tight tracking-tight">
        Your training, everywhere
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        One code is your whole account. No email, no password.
      </p>

      {mode === "signin" ? (
        <div className="mt-8 grid gap-3">
          <input
            value={input}
            onChange={(e) => setInput(normalizeCode(e.target.value))}
            placeholder="ABCD EFGH JKMN"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Account code"
            className="glass-soft tabnum w-full rounded-2xl px-5 py-4 text-center text-lg tracking-[0.18em] outline-none placeholder:text-muted-foreground/50"
          />
          {error && <p className="px-1 text-xs text-destructive">{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={signIn}
            className="press flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" strokeWidth={1.75} />
            )}
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
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" strokeWidth={1.75} />
            )}
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
