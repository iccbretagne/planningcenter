"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface MemberItem {
  id: string;
  firstName: string;
  lastName: string;
  status: "EN_SERVICE" | "EN_SERVICE_DEBRIEF" | "REMPLACANT";
}

interface DepartmentItem {
  id: string;
  name: string;
  ministryName: string;
  members: MemberItem[];
}

interface StarViewData {
  event: {
    id: string;
    title: string;
    date: string;
    church: { name: string };
  };
  departments: DepartmentItem[];
  totalStars: number;
}

interface Props {
  eventId: string;
}

export default function StarViewClient({ eventId }: Props) {
  const router = useRouter();
  const [data, setData] = useState<StarViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/star-view`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function exportPdf() {
    if (!printRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`STAR-${data?.event.title || "export"}.pdf`);
  }

  async function copyImage() {
    if (!printRef.current) return;
    const html2canvas = (await import("html2canvas")).default;

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
    });
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          alert("Image copiee dans le presse-papier");
        } catch {
          alert("Impossible de copier l'image");
        }
      }
    });
  }

  function handlePrint() {
    window.print();
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Chargement...</div>;
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-red-500">
        Impossible de charger les donnees
      </div>
    );
  }

  return (
    <div>
      {/* Action bar - hidden on print */}
      <div className="mb-6 flex items-center gap-3 print:hidden">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors mr-1"
          title="Retour"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <Button onClick={exportPdf}>Exporter PDF</Button>
        <Button variant="secondary" onClick={copyImage}>
          Copier image
        </Button>
        <Button variant="secondary" onClick={handlePrint}>
          Imprimer
        </Button>
      </div>

      {/* Printable zone */}
      <div ref={printRef} className="bg-white rounded-lg shadow p-6 print:shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="text-sm text-gray-600 capitalize">
            {formatDate(data.event.date)}
          </div>
          <h1 className="text-xl font-bold text-icc-violet uppercase tracking-wider">
            STAR EN SERVICE
          </h1>
          <div className="text-lg font-bold text-icc-violet">
            {data.totalStars} STAR
          </div>
        </div>

        {/* Event info */}
        <div className="mb-6 text-center">
          <p className="text-lg font-semibold text-gray-800">
            {data.event.title}
          </p>
          <p className="text-sm text-gray-500">{data.event.church.name}</p>
        </div>

        {/* Department grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
          {data.departments.map((dept) => (
            <div
              key={dept.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <h3 className="text-sm font-bold text-icc-violet uppercase mb-2 tracking-wide">
                {dept.name}
              </h3>
              {dept.members.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  (aucun STAR en service)
                </p>
              ) : (
                <ul className="space-y-1">
                  {dept.members.map((member) => (
                    <li
                      key={member.id}
                      className="text-sm font-semibold text-gray-800"
                    >
                      {member.status === "EN_SERVICE_DEBRIEF" && (
                        <svg className="inline-block w-4 h-4 mr-1 text-icc-violet align-text-bottom" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" title="Debrief">
                          <path d="M12 2C6.48 2 2 5.58 2 10c0 2.24 1.12 4.27 2.94 5.72L3 22l5.34-2.56C9.5 19.8 10.72 20 12 20c5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                        </svg>
                      )}
                      {member.firstName} {member.lastName}
                      {member.status === "REMPLACANT" && (
                        <span className="text-gray-400 font-normal ml-1">
                          (Remplacant)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
