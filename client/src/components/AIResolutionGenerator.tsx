// client/src/components/AIResolutionGenerator.tsx
import { useState } from "react";
import axios from "axios";

interface Props {
  questionId: number;
  questionText: string;
}

export function AIResolutionGenerator({ questionId, questionText }: Props) {
  const [loading, setLoading] = useState(false);
  const [resolution, setResolution] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const generate = async () => {
    setLoading(true);
    setResolution(null);

    try {
      const res = await axios.post("/api/resolutions/generate", {
        questionId,
        questionText,
      });

      setResolution(res.data.resolution);
      setCached(res.data.cached || false);

    } catch (err) {
      console.error(err);
      alert("Erro ao gerar resolução");
    }

    setLoading(false);
  };

  return (
    <div style={{ marginTop: 20 }}>
      <button onClick={generate} disabled={loading}>
        {loading ? "Gerando..." : "Gerar Resolução com IA"}
      </button>

      {cached && <p style={{ color: "green" }}>Carregado do banco (cache)</p>}

      {resolution && (
        <div style={{
          marginTop: 10,
          padding: 12,
          border: "1px solid #ccc",
          borderRadius: 6,
          whiteSpace: "pre-wrap"
        }}>
          {resolution}
        </div>
      )}
    </div>
  );
}
