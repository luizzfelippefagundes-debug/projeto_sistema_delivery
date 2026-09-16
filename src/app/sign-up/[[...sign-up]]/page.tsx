import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
      <SignUp />
    </div>
  );
}
