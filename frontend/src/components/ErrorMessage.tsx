const ErrorMessage = ({ message }: { message: string }) => (
  <div
    role="alert"
    className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
  >
    {message}
  </div>
);

export default ErrorMessage;
