"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { Toaster } from "react-hot-toast";
import { makeQueryClient } from "@/lib/queryClient";
import AiChatWidget from "@/components/ai-chat/AiChatWidget";

type Props = {
  children: ReactNode;
};

export default function Providers({ children }: Props) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" />
      {/* ── AI Customer Service Widget ── Modular, non-destruktif ── */}
      <AiChatWidget />
    </QueryClientProvider>
  );
}
