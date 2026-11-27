const ErrorMessage = ({ message }: { message: string }) => (
  <div
    role="alert"
    className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
  >
    {message}
  </div>
);

export default ErrorMessage;
