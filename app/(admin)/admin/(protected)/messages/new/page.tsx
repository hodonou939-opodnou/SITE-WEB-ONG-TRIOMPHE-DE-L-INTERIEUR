import ComposeForm from "./ComposeForm";

export default function ComposeMessagePage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-leaf-900">Nouveau message</h1>
      <div className="mt-6">
        <ComposeForm />
      </div>
    </div>
  );
}
