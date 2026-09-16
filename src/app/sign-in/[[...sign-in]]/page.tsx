import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
      <SignIn />
    </div>
  );
}
