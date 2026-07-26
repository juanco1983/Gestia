import React from 'react';

interface PdfFooterProps {
  pageNum?: number;
}

export default function PdfFooter({ pageNum }: PdfFooterProps) {
  return (
    <div className="border-t border-slate-300 pt-2 text-[7px] text-slate-400 text-center uppercase font-mono mt-auto shrink-0 leading-normal bg-white">
      Jr. Cerro Azul N 597 Urb. San Ignacio de Monterrico LIMA - Santiago de Surco | Email: ventas@mafortservice.pe / ventas1@mafortservice.pe / ventas2@mafortservice.pe <br />
      OFICINA: Telf. +511 5442114 / EMERGENCIAS: 999993709 / CEL. 998-194-696 {pageNum ? `| PAGINA ${pageNum}` : ''}
    </div>
  );
}
