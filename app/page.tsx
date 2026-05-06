"use client";

import { useState } from "react";
import { IntroView } from "@/components/intro/IntroView";
import { ChatView } from "@/components/chat/ChatView";
import { JudgingView } from "@/components/judging/JudgingView";
import { ResultsView } from "@/components/results/ResultsView";
import { Footer } from "@/components/footer/Footer";
import type { Assessment } from "@/lib/schema";
import type { ChatMessage } from "@/components/chat/types";

type State =
  | { kind: "intro" }
  | { kind: "chat" }
  | { kind: "judging"; transcript: ChatMessage[]; draftJson: Assessment }
  | { kind: "results"; assessment: Assessment; fellBack: boolean };

export default function Home() {
  const [state, setState] = useState<State>({ kind: "intro" });

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1 }}>
        {state.kind === "intro" && <IntroView onBegin={() => setState({ kind: "chat" })} />}
        {state.kind === "chat" && (
          <ChatView
            onAssessmentReady={(transcript, draftJson) =>
              setState({ kind: "judging", transcript, draftJson })
            }
          />
        )}
        {state.kind === "judging" && (
          <JudgingView
            transcript={state.transcript}
            draftJson={state.draftJson}
            onResults={(assessment, fellBack) => setState({ kind: "results", assessment, fellBack })}
          />
        )}
        {state.kind === "results" && (
          <ResultsView assessment={state.assessment} fellBack={state.fellBack} />
        )}
      </div>
      <Footer />
    </main>
  );
}
