'use client';

import { CreditCard, Banknote } from 'lucide-react';

interface PaymentChoiceProps {
  payOnline: boolean;
  onToggle: (payOnline: boolean) => void;
  rate: number;
}

export function PaymentChoice({ payOnline, onToggle, rate }: PaymentChoiceProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#1E1B4B] mb-1.5">
        Mode de paiement
      </label>

      {/* Pay online */}
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
          payOnline
            ? 'ring-2 ring-[#3D52A0] border-[#3D52A0] bg-[#3D52A0]/5'
            : 'border-[#E5E7EB] bg-white hover:border-[#3D52A0]/40'
        }`}
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          payOnline ? 'bg-[#3D52A0]/10' : 'bg-[#F1F0F9]'
        }`}>
          <CreditCard className={`w-4 h-4 ${payOnline ? 'text-[#3D52A0]' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${payOnline ? 'text-[#1E1B4B]' : 'text-gray-700'}`}>
            Payer en ligne maintenant
          </p>
          <p className="text-xs text-gray-500">
            Paiement sécurisé par carte · {rate}€
          </p>
        </div>
        {/* Radio indicator */}
        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          payOnline ? 'border-[#3D52A0]' : 'border-gray-300'
        }`}>
          {payOnline && <span className="w-2.5 h-2.5 rounded-full bg-[#3D52A0]" />}
        </span>
      </button>

      {/* Pay at office */}
      <button
        type="button"
        onClick={() => onToggle(false)}
        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
          !payOnline
            ? 'ring-2 ring-[#3D52A0] border-[#3D52A0] bg-[#3D52A0]/5'
            : 'border-[#E5E7EB] bg-white hover:border-[#3D52A0]/40'
        }`}
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          !payOnline ? 'bg-[#3D52A0]/10' : 'bg-[#F1F0F9]'
        }`}>
          <Banknote className={`w-4 h-4 ${!payOnline ? 'text-[#3D52A0]' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${!payOnline ? 'text-[#1E1B4B]' : 'text-gray-700'}`}>
            Payer au cabinet
          </p>
          <p className="text-xs text-gray-500">
            Espèces, chèque ou carte sur place
          </p>
        </div>
        {/* Radio indicator */}
        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          !payOnline ? 'border-[#3D52A0]' : 'border-gray-300'
        }`}>
          {!payOnline && <span className="w-2.5 h-2.5 rounded-full bg-[#3D52A0]" />}
        </span>
      </button>
    </div>
  );
}
