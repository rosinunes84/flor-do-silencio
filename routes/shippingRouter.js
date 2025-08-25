import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from '@/components/ui/use-toast';

export default function ShippingCalculator({
  cep,
  setCep,
  shippingLoading,
  handleCalculateShipping,
  shippingOptions,
  selectedShipping,
  setSelectedShipping
}) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);

  const calculateShipping = async () => {
    if (!cep || cep.length < 8) {
      return toast({
        title: "CEP inválido",
        description: "Informe um CEP válido para calcular o frete",
        variant: "destructive"
      });
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/shipping/calculate`,
        { cep }
      );
      setOptions(response.data || []);
      if (!response.data?.length) {
        toast({
          title: "Ops!",
          description: "Não encontramos opções de frete para este CEP.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro no frete:", error);
      toast({
        title: "Erro",
        description: "Não foi possível calcular o frete",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualiza a opção selecionada se já houver um shipping
  useEffect(() => {
    if (selectedShipping && options.length) {
      const found = options.find(o => o.id === selectedShipping.id);
      if (found) setSelectedShipping(found);
    }
  }, [options]);

  return (
    <div className="bg-white shadow p-4 rounded space-y-3">
      <h2 className="text-lg font-bold">Calcular Frete</h2>
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Informe seu CEP"
          value={cep}
          onChange={e => setCep(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <Button onClick={calculateShipping} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calcular"}
        </Button>
      </div>

      {options.length > 0 && (
        <div className="space-y-2 mt-2">
          {options.map(option => (
            <div key={option.id} className="flex items-center justify-between">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="shippingOption"
                  value={option.id}
                  checked={selectedShipping?.id === option.id}
                  onChange={() => setSelectedShipping(option)}
                  className="mr-2"
                />
                {option.name} - R$ {option.price.toFixed(2)} ({option.estimatedDays} dias)
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
