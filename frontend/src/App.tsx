import { Route, Switch } from "wouter";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { AdminOnboardingPanel } from "@/pages/AdminOnboardingPanel";
import { MentorClaimPage } from "@/pages/MentorClaimPage";

export default function App() {
  return (
    <Switch>
      <Route path="/admin/:token/new" component={AdminOnboardingPanel} />
      <Route path="/mentor/:inviteToken" component={MentorClaimPage} />
      <Route component={OnboardingFlow} />
    </Switch>
  );
}
