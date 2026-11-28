import { useEffect, useState } from "react";
import { masteryService, MasteryReport } from "../services/masteryService";
import { getErrorMessage } from "../utils/errors";
import ErrorMessage from "./ErrorMessage";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

const band = (m: number) =>
  m >= 0.75
    ? { label: "Strong", bar: "bg-success" }
    : m >= 0.5
      ? { label: "Developing", bar: "bg-warning" }
      : { label: "Needs practice", bar: "bg-destructive" };

/**
 * Student view: predicted mastery per skill from quiz history, weakest first.
 * Hidden until the student has answered at least one quiz question.
 */
const MasterySection = ({
  courseId,
  refreshKey = 0,
}: {
  courseId: string;
  refreshKey?: number;
}) => {
  const [report, setReport] = useState<MasteryReport | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    masteryService
      .mine(courseId)
      .then((r) => !cancelled && (setReport(r), setError("")))
      .catch(
        (err) =>
          !cancelled &&
          setError(getErrorMessage(err, "Could not load your mastery")),
      );
    return () => {
      cancelled = true;
    };
  }, [courseId, refreshKey]);

  if (error) return <ErrorMessage message={error} />;
  if (!report || report.skills.length === 0) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Your mastery</CardTitle>
        <CardDescription>
          {report.method === "model" && report.model
            ? `Predicted chance of answering the next question correctly, from a model trained on ${report.model.dataset} (held-out AUC ${report.model.heldOutAuc.toFixed(2)}).`
            : "Estimated chance of answering the next question correctly, from your quiz accuracy so far."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.skills.map((s) => {
          const pct = Math.round(s.mastery * 100);
          const b = band(s.mastery);
          return (
            <div key={s.skill} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  {s.skill}
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {s.confidence === "low" && (
                    <Badge variant="secondary">Early estimate</Badge>
                  )}
                  {pct}% · {b.label}
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label={`${s.skill} mastery`}
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full ${b.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {s.correct} of {s.attempts} answers correct
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default MasterySection;
