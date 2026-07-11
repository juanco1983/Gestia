import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Plus, 
  Search, 
  Clock, 
  Layers, 
  UserPlus, 
  Briefcase, 
  Calendar,
  AlertCircle,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { Client, Contrato, User } from '../types';

interface ClientesContratosViewProps {
  clients: Client[];
  contratos: Contrato[];
  users?: User[];
  currentUser?: { email: string; username: string };
  onAddClient: (newClient: Client) => void;
  onUpdateClient?: (updated: Client) => void;
  onAddContrato: (newContrato: Contrato) => void;
  onUpdateContrato?: (updated: Contrato) => void;
}

export default function ClientesContratosView({
  clients,
  contratos,
  users = [],
  currentUser,
  onAddClient,
  onUpdateClient,
  onAddContrato,
  onUpdateContrato
}: ClientesContratosViewProps) {
  const [activeTab, setActiveTab] = useState<'clientes' | 'contratos'>('clientes');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientViewMode, setClientViewMode] = useState<'grid' | 'list'>('grid');

  // FSM states
  const [tarifario, setTarifario] = useState<any[]>([]);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [montoAmpliacionInput, setMontoAmpliacionInput] = useState('');
  const [nuevoConceptoTarifario, setNuevoConceptoTarifario] = useState('');
  const [nuevoPrecioTarifario, setNuevoPrecioTarifario] = useState('');
  const [nuevoEquipoModelo, setNuevoEquipoModelo] = useState('');
  const [nuevoEquipoSerie, setNuevoEquipoSerie] = useState('');
  
  // Modal controllers
  const [showClientModal, setShowClientModal] = useState(false);
  const [showContratoModal, setShowContratoModal] = useState(false);
  const [selectedClientForView, setSelectedClientForView] = useState<Client | null>(null);
  const [isEditingClient, setIsEditingClient] = useState(false);

  // Client form state
  const [clientForm, setClientForm] = useState({
    razonSocial: '',
    ruc: '',
    direccionSede: '',
    distrito: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: ''
  });

  // Client edit form state
  const [editClientForm, setEditClientForm] = useState({
    id: '',
    razonSocial: '',
    ruc: '',
    direccionSede: '',
    distrito: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: ''
  });

  // Contrato form state
  const [contratoForm, setContratoForm] = useState({
    clientId: '',
    ot_marco: '',
    tipo_servicio: 'CONTRATO',
    tipo_contract: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'VIGENTE' as const,
    comercialId: '',
    comentarios: '',
    presupuesto_total_usd: '',
    tarifa_hora_tecnico: ''
  });

  const [contratoViewMode, setContratoViewMode] = useState<'list' | 'grid'>('list');
  const [selectedContratoForView, setSelectedContratoForView] = useState<Contrato | null>(null);
  const [isEditingContrato, setIsEditingContrato] = useState(false);

  const [editContratoForm, setEditContratoForm] = useState({
    id: '',
    clientId: '',
    ot_marco: '',
    tipo_servicio: 'CONTRATO',
    tipo_contract: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'VIGENTE' as 'VIGENTE' | 'TERMINADO' | 'ANULADO',
    comercialId: '',
    comentarios: '',
    presupuesto_total_usd: '',
    saldo_disponible_usd: ''
  });

  // Filter lists based on search query
  const filteredClients = clients.filter(c => 
    c.razonSocial.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ruc.includes(searchQuery) ||
    c.contactoNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.distrito.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContratos = contratos.filter(co => {
    const clientName = co.cliente || clients.find(cl => cl.id === co.clientId)?.razonSocial || '';
    const comercialName = co.comercial || users.find(u => u.id === co.comercialId)?.username || '';
    return (
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      co.tipo_contrato.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comercialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      co.ot_marco.toString().includes(searchQuery)
    );
  });

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.razonSocial || !clientForm.ruc) return;

    const newClient: Client = {
      id: `client_${Date.now()}`,
      razonSocial: clientForm.razonSocial.trim(),
      ruc: clientForm.ruc.trim(),
      direccionSede: clientForm.direccionSede.trim() || 'No especificada',
      distrito: clientForm.distrito.trim() || 'Lima',
      contactoNombre: clientForm.contactoNombre.trim() || 'No especificado',
      contactoEmail: clientForm.contactoEmail.trim() || 'No especificado',
      contactoTelefono: clientForm.contactoTelefono.trim() || 'No especificado'
    };

    onAddClient(newClient);
    setClientForm({
      razonSocial: '',
      ruc: '',
      direccionSede: '',
      distrito: '',
      contactoNombre: '',
      contactoEmail: '',
      contactoTelefono: ''
    });
    setShowClientModal(false);
  };

  const handleClientClick = (client: Client) => {
    setSelectedClientForView(client);
    setIsEditingClient(false);
    setEditClientForm({
      id: client.id,
      razonSocial: client.razonSocial,
      ruc: client.ruc,
      direccionSede: client.direccionSede,
      distrito: client.distrito,
      contactoNombre: client.contactoNombre,
      contactoEmail: client.contactoEmail,
      contactoTelefono: client.contactoTelefono
    });
  };

  const handleClientUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClientForm.razonSocial || !editClientForm.ruc) return;

    const updatedClient: Client = {
      id: editClientForm.id,
      razonSocial: editClientForm.razonSocial.trim(),
      ruc: editClientForm.ruc.trim(),
      direccionSede: editClientForm.direccionSede.trim() || 'No especificada',
      distrito: editClientForm.distrito.trim() || 'Lima',
      contactoNombre: editClientForm.contactoNombre.trim() || 'No especificado',
      contactoEmail: editClientForm.contactoEmail.trim() || 'No especificado',
      contactoTelefono: editClientForm.contactoTelefono.trim() || 'No especificado'
    };

    if (onUpdateClient) {
      onUpdateClient(updatedClient);
    }
    
    setSelectedClientForView(null);
    setIsEditingClient(false);
  };

  const handleContratoClick = (contrato: Contrato) => {
    setSelectedContratoForView(contrato);
    setIsEditingContrato(false);
    setMontoAmpliacionInput('');
    setNuevoConceptoTarifario('');
    setNuevoPrecioTarifario('');
    setNuevoEquipoModelo('');
    setNuevoEquipoSerie('');

    // Fetch Tarifario and Equipos
    fetch(`/api/contratos/${contrato.id}/tarifario`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTarifario(data); })
      .catch(err => console.error("Error cargando tarifario:", err));

    fetch(`/api/contratos/${contrato.id}/equipos`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setEquipos(data); })
      .catch(err => console.error("Error cargando equipos cubiertos:", err));

    setEditContratoForm({
      id: contrato.id,
      clientId: contrato.clientId || '',
      ot_marco: contrato.ot_marco.toString(),
      tipo_servicio: contrato.tipo_servicio,
      tipo_contract: contrato.tipo_contrato,
      fecha_inicio: contrato.fecha_inicio,
      fecha_fin: contrato.fecha_fin,
      estado: contrato.estado,
      comercialId: contrato.comercialId || '',
      comentarios: contrato.comentarios,
      presupuesto_total_usd: contrato.presupuesto_total_usd !== undefined ? contrato.presupuesto_total_usd.toString() : '',
      saldo_disponible_usd: contrato.saldo_disponible_usd !== undefined ? contrato.saldo_disponible_usd.toString() : ''
    });
  };

  const handleContratoUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContratoForm.clientId || !editContratoForm.ot_marco) return;

    const matchedClient = clients.find(c => c.id === editContratoForm.clientId);
    const matchedComercial = users.find(u => u.id === editContratoForm.comercialId);

    const updatedContrato: Contrato = {
      id: editContratoForm.id,
      clientId: editContratoForm.clientId,
      cliente: matchedClient ? matchedClient.razonSocial : 'Cliente General',
      ot_marco: parseInt(editContratoForm.ot_marco) || 0,
      tipo_servicio: editContratoForm.tipo_servicio,
      tipo_contrato: editContratoForm.tipo_contract.trim() || 'Servicio General',
      fecha_inicio: editContratoForm.fecha_inicio,
      fecha_fin: editContratoForm.fecha_fin,
      estado: editContratoForm.estado,
      comercialId: editContratoForm.comercialId,
      comercial: matchedComercial ? matchedComercial.username : 'Asignado General',
      comentarios: editContratoForm.comentarios.trim() || '',
      presupuesto_total_usd: editContratoForm.presupuesto_total_usd ? parseFloat(editContratoForm.presupuesto_total_usd) : undefined,
      saldo_disponible_usd: editContratoForm.saldo_disponible_usd ? parseFloat(editContratoForm.saldo_disponible_usd) : undefined
    };

    if (onUpdateContrato) {
      onUpdateContrato(updatedContrato);
    }

    setSelectedContratoForView(null);
    setIsEditingContrato(false);
  };

  const handleContratoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contratoForm.clientId || !contratoForm.ot_marco) return;

    const matchedClient = clients.find(c => c.id === contratoForm.clientId);
    const matchedComercial = users.find(u => u.id === contratoForm.comercialId);

    const newContrato: any = {
      id: `contrato_${Date.now()}`,
      clientId: contratoForm.clientId,
      cliente: matchedClient ? matchedClient.razonSocial : 'Cliente General',
      ot_marco: parseInt(contratoForm.ot_marco) || 0,
      tipo_servicio: contratoForm.tipo_servicio,
      tipo_contrato: contratoForm.tipo_contract.trim() || 'Servicio General',
      fecha_inicio: contratoForm.fecha_inicio || new Date().toISOString().split('T')[0],
      fecha_fin: contratoForm.fecha_fin || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      estado: contratoForm.estado,
      comercialId: contratoForm.comercialId,
      comercial: matchedComercial ? matchedComercial.username : 'Asignado General',
      comentarios: contratoForm.comentarios.trim() || '',
      presupuesto_total_usd: contratoForm.presupuesto_total_usd ? parseFloat(contratoForm.presupuesto_total_usd) : undefined,
      saldo_disponible_usd: contratoForm.presupuesto_total_usd ? parseFloat(contratoForm.presupuesto_total_usd) : undefined,
      saldo_actual_contrato: contratoForm.presupuesto_total_usd ? parseFloat(contratoForm.presupuesto_total_usd) : undefined,
      sobregiro: false,
      tarifa_hora_tecnico: contratoForm.tarifa_hora_tecnico ? parseFloat(contratoForm.tarifa_hora_tecnico) : undefined
    };

    onAddContrato(newContrato);
    setContratoForm({
      clientId: '',
      ot_marco: '',
      tipo_servicio: 'CONTRATO',
      tipo_contract: '',
      fecha_inicio: '',
      fecha_fin: '',
      estado: 'VIGENTE',
      comercialId: '',
      comentarios: '',
      presupuesto_total_usd: '',
      tarifa_hora_tecnico: ''
    });
    setShowContratoModal(false);
  };

  const handleAgregarTarifa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContratoForView || !nuevoConceptoTarifario || !nuevoPrecioTarifario) return;

    try {
      const res = await fetch(`/api/contratos/${selectedContratoForView.id}/tarifario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concepto: nuevoConceptoTarifario.trim(),
          precioUnitario: parseFloat(nuevoPrecioTarifario)
        })
      });
      if (res.ok) {
        const newItem = await res.json();
        setTarifario([...tarifario, newItem]);
        setNuevoConceptoTarifario('');
        setNuevoPrecioTarifario('');
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'No se pudo agregar la tarifa'}`);
      }
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    }
  };

  const handleAgregarEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContratoForView || !nuevoEquipoModelo || !nuevoEquipoSerie) return;

    try {
      const res = await fetch(`/api/contratos/${selectedContratoForView.id}/equipos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipoModelo: nuevoEquipoModelo.trim(),
          serie: nuevoEquipoSerie.trim()
        })
      });
      if (res.ok) {
        const newItem = await res.json();
        setEquipos([...equipos, newItem]);
        setNuevoEquipoModelo('');
        setNuevoEquipoSerie('');
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'No se pudo registrar el equipo'}`);
      }
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    }
  };

  const handleAplicarAmpliacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContratoForView || !montoAmpliacionInput) return;

    const monto = parseFloat(montoAmpliacionInput);
    if (isNaN(monto) || monto <= 0) {
      alert("Por favor ingrese un monto válido positivo");
      return;
    }

    try {
      const res = await fetch(`/api/contratos/${selectedContratoForView.id}/ampliaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montoAmpliacion: monto })
      });
      if (res.ok) {
        const data = await res.json();
        alert("Ampliación aplicada con éxito");
        
        // Actualizar contrato en la vista en tiempo real
        const updatedContrato = {
          ...selectedContratoForView,
          saldo_disponible_usd: data.nuevoSaldo,
          presupuesto_total_usd: data.nuevoPresupuesto,
          saldo_actual_contrato: data.nuevoSaldo,
          sobregiro: data.nuevoSaldo >= 0 ? false : selectedContratoForView.sobregiro
        };
        setSelectedContratoForView(updatedContrato);
        
        // Actualizar en la lista de contratos principal
        if (onUpdateContrato) {
          onUpdateContrato(updatedContrato);
        }
        setMontoAmpliacionInput('');
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'No se pudo aplicar la ampliación'}`);
      }
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 text-left" id="clientes-contratos-panel">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-150">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <Building2 className="text-[#00B594]" size={22} />
            Clientes, Contratos y Acuerdos Marco
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Gestión centralizada del directorio legal de clientes de MAFORT y sus respectivos contratos de servicio activos.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'clientes' ? (
            <button
              onClick={() => setShowClientModal(true)}
              className="bg-[#00B594] hover:bg-[#00a385] text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-[0_4px_12px_rgba(0,181,148,0.2)] flex items-center gap-2 cursor-pointer transition-all"
            >
              <UserPlus size={15} />
              Registrar Cliente
            </button>
          ) : (
            <button
              onClick={() => setShowContratoModal(true)}
              className="bg-[#00B594] hover:bg-[#00a385] text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-[0_4px_12px_rgba(0,181,148,0.2)] flex items-center gap-2 cursor-pointer transition-all"
            >
              <Briefcase size={15} />
              Registrar Contrato
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-px">
        <div className="flex gap-6">
          <button
            onClick={() => { setActiveTab('clientes'); setSearchQuery(''); }}
            className={`pb-3 text-xs font-bold font-sans tracking-wide transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'clientes'
                ? 'border-[#00B594] text-[#00B594] font-black'
                : 'border-transparent text-slate-400 hover:text-slate-800'
            }`}
          >
            <Building2 size={14} />
            <span>Directorio de Clientes ({clients.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('contratos'); setSearchQuery(''); }}
            className={`pb-3 text-xs font-bold font-sans tracking-wide transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'contratos'
                ? 'border-[#00B594] text-[#00B594] font-black'
                : 'border-transparent text-slate-400 hover:text-slate-800'
            }`}
          >
            <Briefcase size={14} />
            <span>Contratos Activos ({contratos.length})</span>
          </button>
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center gap-3 max-w-sm w-full mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder={activeTab === 'clientes' ? "Buscar por razón social, ruc, distrito..." : "Buscar por cliente, comercial, ot marco..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-55 border border-slate-200 rounded-2xl py-1.5 pl-9 pr-4 text-xs text-slate-750 focus:outline-none focus:ring-1 focus:ring-[#00B594]"
            />
          </div>
          {activeTab === 'clientes' ? (
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setClientViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  clientViewMode === 'grid'
                    ? 'bg-white text-[#00B594] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Vista de Tarjetas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              </button>
              <button
                type="button"
                onClick={() => setClientViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  clientViewMode === 'list'
                    ? 'bg-white text-[#00B594] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Vista de Lista"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setContratoViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  contratoViewMode === 'grid'
                    ? 'bg-white text-[#00B594] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Vista de Tarjetas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              </button>
              <button
                type="button"
                onClick={() => setContratoViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  contratoViewMode === 'list'
                    ? 'bg-white text-[#00B594] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Vista de Lista"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'clientes' ? (
        filteredClients.length === 0 ? (
          <div className="py-12 text-center text-slate-450 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <Building2 size={40} className="mx-auto mb-3 opacity-30 text-slate-500" />
            <p className="text-xs font-bold">No se encontraron clientes.</p>
            <p className="text-[10px] mt-1 text-slate-400">Intenta cambiar el criterio de búsqueda o registra uno nuevo.</p>
          </div>
        ) : clientViewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClients.map((client) => {
              // count active contracts
              const clientContracts = contratos.filter(c => c.cliente === client.razonSocial);
              return (
                <div 
                  key={client.id} 
                  onClick={() => handleClientClick(client)}
                  className="bg-white border border-slate-150 rounded-3xl p-5 hover:border-[#00B594]/60 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-[#E6F7F4] transition-colors">
                        <Building2 size={18} className="text-[#00B594]" />
                      </div>
                      <span className="text-[9px] font-extrabold uppercase font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        RUC {client.ruc}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 line-clamp-2 group-hover:text-[#00B594] transition-colors" title={client.razonSocial}>
                        {client.razonSocial}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-slate-450 font-bold mt-1.5">
                        <MapPin size={10} className="text-slate-400 shrink-0" />
                        <span>{client.direccionSede}, {client.distrito}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 font-semibold">Contacto:</span>
                        <span className="text-slate-700 font-black">{client.contactoNombre}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 font-semibold">Email:</span>
                        <span className="text-slate-700 font-mono select-all font-semibold text-slate-600">{client.contactoEmail}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 font-semibold">Teléfono:</span>
                        <span className="text-slate-700 font-mono font-bold text-slate-600">{client.contactoTelefono}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-450">Contratos:</span>
                    <span className="text-[10px] font-black text-[#00B594] bg-[#E6F7F4] px-2 py-0.5 rounded-md">
                      {clientContracts.length} activo(s)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-150">
                  <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">Razón Social</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">RUC</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">Dirección Sede / Distrito</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">Contacto</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">Email / Teléfono</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">Contratos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const clientContracts = contratos.filter(c => c.cliente === client.razonSocial);
                  return (
                    <tr 
                      key={client.id} 
                      onClick={() => handleClientClick(client)}
                      className="hover:bg-[#00B594]/5 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4">
                        <div className="text-xs font-black text-slate-800 group-hover:text-[#00B594] transition-colors">{client.razonSocial}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[9px] font-black font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-150">
                          {client.ruc}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-700 font-bold">{client.direccionSede}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{client.distrito}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-700 font-bold">{client.contactoNombre}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-600 font-mono select-all">{client.contactoEmail}</div>
                        <div className="text-[10px] text-slate-500 font-mono font-bold">{client.contactoTelefono}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[9px] font-extrabold font-mono px-2 py-0.5 rounded-md bg-[#E6F7F4] text-[#00B594] group-hover:bg-[#00B594] group-hover:text-white transition-all">
                          {clientContracts.length} activo(s)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {filteredContratos.length === 0 ? (
            <div className="py-12 text-center text-slate-450 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <Briefcase size={40} className="mx-auto mb-3 opacity-30 text-slate-500" />
              <p className="text-xs font-bold">No se encontraron contratos registrados.</p>
              <p className="text-[10px] mt-1 text-slate-400">Intenta registrar un contrato o cambiar la consulta de búsqueda.</p>
            </div>
          ) : contratoViewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredContratos.map((contrato) => {
                const presupuesto = contrato.presupuesto_total_usd;
                const saldo = contrato.saldo_disponible_usd ?? presupuesto;
                const consumo = presupuesto ? presupuesto - saldo : 0;
                const pct = (presupuesto && presupuesto > 0) ? (consumo / presupuesto) * 100 : 0;
                
                let progressColor = "bg-[#00B594]";
                if (pct >= 95) progressColor = "bg-rose-500";
                else if (pct >= 80) progressColor = "bg-amber-500";

                return (
                  <div 
                    key={contrato.id} 
                    onClick={() => handleContratoClick(contrato)}
                    className="bg-white border border-slate-150 rounded-3xl p-5 hover:border-[#00B594]/60 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-[#E6F7F4] transition-colors">
                          <Briefcase size={18} className="text-[#00B594]" />
                        </div>
                        <span className="text-[9px] font-extrabold uppercase font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          OT Marco #{contrato.ot_marco}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-800 line-clamp-1 group-hover:text-[#00B594] transition-colors">
                          {contrato.cliente}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[9px] font-black font-mono px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-650 border border-slate-150">
                            {contrato.tipo_servicio}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold truncate max-w-xs">{contrato.tipo_contrato}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400 font-semibold">Vigencia:</span>
                          <span className="text-slate-700 font-bold font-mono text-[9px]">{contrato.fecha_inicio} al {contrato.fecha_fin}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400 font-semibold">Responsable:</span>
                          <span className="text-slate-700 font-bold">{contrato.comercial}</span>
                        </div>
                      </div>

                      {presupuesto ? (
                        <div className="pt-3 border-t border-slate-100 space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-450">Consumo ({pct.toFixed(0)}%):</span>
                            <span className="text-slate-700">${consumo.toFixed(0)} / ${presupuesto.toFixed(0)}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${progressColor} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400">
                            <span>Saldo disponible:</span>
                            <span className="font-mono font-bold text-slate-605">${saldo.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-450 italic">
                          Consumo / Saldo no definidos
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">Estado:</span>
                      <span className={`text-[9px] font-extrabold font-mono px-2 py-0.5 rounded-full uppercase ${
                        contrato.estado === 'VIGENTE'
                          ? 'bg-[#E6F7F4] text-[#00B594]'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {contrato.estado}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-150">
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">Cliente</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">OT Marco</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">Tipo Documento</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">Descripción del Alcance</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">Vigencia</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">Responsable</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">Consumo / Saldo</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContratos.map((contrato) => (
                    <tr 
                      key={contrato.id} 
                      onClick={() => handleContratoClick(contrato)}
                      className="hover:bg-[#00B594]/5 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4">
                        <div className="text-xs font-black text-slate-800 group-hover:text-[#00B594] transition-colors">{contrato.cliente}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-extrabold font-mono text-slate-500">#{contrato.ot_marco}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[9px] font-black font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-150">
                          {contrato.tipo_servicio}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-600 font-semibold line-clamp-1 max-w-xs">{contrato.tipo_contrato}</div>
                        {contrato.comentarios && (
                          <div className="text-[9px] text-slate-400 mt-0.5 font-medium italic">{contrato.comentarios}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-[10px] font-bold text-slate-500">
                        <div className="flex flex-col">
                          <span>Inicia: {contrato.fecha_inicio}</span>
                          <span>Termina: {contrato.fecha_fin}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-bold text-slate-600">{contrato.comercial}</div>
                      </td>
                      <td className="px-5 py-4">
                        {contrato.presupuesto_total_usd ? (() => {
                          const presupuesto = contrato.presupuesto_total_usd;
                          const saldo = contrato.saldo_disponible_usd ?? presupuesto;
                          const consumo = presupuesto - saldo;
                          const pct = presupuesto > 0 ? (consumo / presupuesto) * 100 : 0;
                          
                          let badgeClass = "bg-[#E6F7F4] text-[#00B594] border-[#00B594]/20";
                          if (pct >= 95) badgeClass = "bg-rose-100 text-rose-600 border-rose-200";
                          else if (pct >= 80) badgeClass = "bg-amber-100 text-amber-600 border-amber-200";
                          
                          return (
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`text-[9px] font-extrabold font-mono px-2 py-0.5 rounded border ${badgeClass}`}>
                                {pct.toFixed(0)}% CONSUMIDO
                              </span>
                              <span className="text-[10px] font-bold text-slate-600">
                                Saldo: ${saldo.toFixed(2)}
                              </span>
                            </div>
                          );
                        })() : (
                          <span className="text-[10px] font-medium text-slate-400 italic">No definido</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[9px] font-extrabold font-mono px-2 py-0.5 rounded-full uppercase ${
                          contrato.estado === 'VIGENTE'
                            ? 'bg-[#E6F7F4] text-[#00B594]'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {contrato.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL CLIENTE */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Building2 size={16} className="text-[#00B594]" />
                Registrar Nuevo Cliente
              </h3>
              <button 
                onClick={() => setShowClientModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleClientSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Razón Social Legal <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Repsol Data Center Perú S.A."
                  value={clientForm.razonSocial}
                  onChange={(e) => setClientForm({ ...clientForm, razonSocial: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00B594] focus:ring-1 focus:ring-[#00B594]"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">RUC (Identificación Tributaria) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 20100123456"
                  maxLength={11}
                  value={clientForm.ruc}
                  onChange={(e) => setClientForm({ ...clientForm, ruc: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00B594] focus:ring-1 focus:ring-[#00B594] font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Dirección Sede</label>
                  <input
                    type="text"
                    placeholder="Ej: Av. El Derby 150"
                    value={clientForm.direccionSede}
                    onChange={(e) => setClientForm({ ...clientForm, direccionSede: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Distrito</label>
                  <input
                    type="text"
                    placeholder="Ej: Santiago de Surco"
                    value={clientForm.distrito}
                    onChange={(e) => setClientForm({ ...clientForm, distrito: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-[#00B594] font-mono">Datos del Contacto</h4>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Nombre Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej: Ing. Carlos Mendoza"
                    value={clientForm.contactoNombre}
                    onChange={(e) => setClientForm({ ...clientForm, contactoNombre: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Email Contacto</label>
                    <input
                      type="email"
                      placeholder="Ej: carlos@repsol.pe"
                      value={clientForm.contactoEmail}
                      onChange={(e) => setClientForm({ ...clientForm, contactoEmail: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Teléfono</label>
                    <input
                      type="text"
                      placeholder="Ej: 998765432"
                      value={clientForm.contactoTelefono}
                      onChange={(e) => setClientForm({ ...clientForm, contactoTelefono: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00B594] hover:bg-[#009b7e] text-white font-black rounded-xl text-xs cursor-pointer shadow-[0_3px_8px_rgba(0,181,148,0.15)]"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONTRATO */}
      {showContratoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Briefcase size={16} className="text-[#00B594]" />
                Registrar Nuevo Contrato/Acuerdo
              </h3>
              <button 
                onClick={() => setShowContratoModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleContratoSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Seleccionar Cliente <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={contratoForm.clientId}
                  onChange={(e) => setContratoForm({ ...contratoForm, clientId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00B594]"
                >
                  <option value="">Seleccione un cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.razonSocial}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">OT Marco Padre <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 1105"
                    value={contratoForm.ot_marco}
                    onChange={(e) => setContratoForm({ ...contratoForm, ot_marco: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Tipo Contratación</label>
                  <select
                    value={contratoForm.tipo_servicio}
                    onChange={(e) => setContratoForm({ ...contratoForm, tipo_servicio: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  >
                    <option value="CONTRATO">CONTRATO</option>
                    <option value="OC">ORDEN COMPRA (OC)</option>
                    <option value="OS">ORDEN SERVICIO (OS)</option>
                    <option value="CORREO">CORREO / ACUERDO</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Descripción del Alcance / Contrato <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Alquiler de UPS 80KVA y visitas mensuales"
                  value={contratoForm.tipo_contract}
                  onChange={(e) => setContratoForm({ ...contratoForm, tipo_contract: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Fecha Inicio</label>
                  <input
                    type="date"
                    value={contratoForm.fecha_inicio}
                    onChange={(e) => setContratoForm({ ...contratoForm, fecha_inicio: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Fecha Fin</label>
                  <input
                    type="date"
                    value={contratoForm.fecha_fin}
                    onChange={(e) => setContratoForm({ ...contratoForm, fecha_fin: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Responsable Comercial <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={contratoForm.comercialId}
                    onChange={(e) => setContratoForm({ ...contratoForm, comercialId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-[#00B594]"
                  >
                    <option value="">Seleccione comercial...</option>
                    {users.filter(u => u.role === 'Ventas' && u.estado === 'Activo').map(u => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Estado Inicial</label>
                  <select
                    value={contratoForm.estado}
                    onChange={(e) => setContratoForm({ ...contratoForm, estado: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="VIGENTE">VIGENTE</option>
                    <option value="TERMINADO">TERMINADO</option>
                    <option value="ANULADO">ANULADO</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Presupuesto Inicial (USD)</label>
                  <input
                    type="number"
                    placeholder="Ej: 50000"
                    value={contratoForm.presupuesto_total_usd}
                    onChange={(e) => setContratoForm({ ...contratoForm, presupuesto_total_usd: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Tarifa Hora Técnico (USD)</label>
                  <input
                    type="number"
                    placeholder="Ej: 50"
                    value={contratoForm.tarifa_hora_tecnico}
                    onChange={(e) => setContratoForm({ ...contratoForm, tarifa_hora_tecnico: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Comentarios Adicionales</label>
                <textarea
                  placeholder="Detalles del acuerdo, periodicidad de pagos, etc..."
                  rows={2}
                  value={contratoForm.comentarios}
                  onChange={(e) => setContratoForm({ ...contratoForm, comentarios: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowContratoModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00B594] hover:bg-[#009b7e] text-white font-black rounded-xl text-xs cursor-pointer shadow-[0_3px_8px_rgba(0,181,148,0.15)]"
                >
                  Guardar Contrato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE / EDICIÓN CLIENTE */}
      {selectedClientForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 my-8">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Building2 size={16} className="text-[#00B594]" />
                {isEditingClient ? 'Editar Información del Cliente' : 'Ficha del Cliente'}
              </h3>
              <button 
                onClick={() => setSelectedClientForView(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {!isEditingClient ? (
              /* MODO VISUALIZACIÓN */
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">{selectedClientForView.razonSocial}</h4>
                    <span className="text-[9px] font-extrabold uppercase font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full inline-block mt-1 border border-slate-200">
                      RUC: {selectedClientForView.ruc}
                    </span>
                  </div>
                  <div className="p-3 bg-[#E6F7F4] rounded-2xl border border-[#00B594]/10">
                    <Building2 size={24} className="text-[#00B594]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Dirección Sede</span>
                    <span className="text-xs text-slate-700 font-bold block">{selectedClientForView.direccionSede}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Distrito</span>
                    <span className="text-xs text-slate-700 font-bold block">{selectedClientForView.distrito}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Nombre Contacto</span>
                    <span className="text-xs text-slate-700 font-bold block">{selectedClientForView.contactoNombre}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Teléfono</span>
                    <span className="text-xs text-slate-750 font-mono font-bold block">{selectedClientForView.contactoTelefono}</span>
                  </div>
                  <div className="col-span-full space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Email Contacto</span>
                    <span className="text-xs text-slate-750 font-mono select-all font-semibold block text-slate-650">{selectedClientForView.contactoEmail}</span>
                  </div>
                </div>

                {/* Lista de Contratos Activos del Cliente */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-[#00B594] font-mono">Contratos Asociados</h5>
                  {(() => {
                    const clientContracts = contratos.filter(c => c.cliente === selectedClientForView.razonSocial);
                    if (clientContracts.length === 0) {
                      return (
                        <p className="text-[10px] text-slate-400 font-medium italic">No se registran contratos asociados a este cliente en el sistema.</p>
                      );
                    }
                    return (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {clientContracts.map(contract => (
                          <div key={contract.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-150 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-black text-slate-800">OT Marco: #{contract.ot_marco}</div>
                              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{contract.tipo_contrato}</div>
                              <div className="text-[9px] text-slate-450 font-medium mt-0.5">Vence: {contract.fecha_fin}</div>
                            </div>
                            <span className="text-[9px] font-extrabold font-mono px-2 py-0.5 rounded bg-[#E6F7F4] text-[#00B594] uppercase shrink-0">
                              {contract.estado}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedClientForView(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingClient(true)}
                    className="px-5 py-2 bg-[#00B594] hover:bg-[#009b7e] text-white font-black rounded-xl text-xs cursor-pointer shadow-[0_3px_8px_rgba(0,181,148,0.15)] flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    Editar Datos
                  </button>
                </div>
              </div>
            ) : (
              /* MODO EDICIÓN */
              <form onSubmit={handleClientUpdateSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Razón Social Legal <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Repsol Data Center Perú S.A."
                    value={editClientForm.razonSocial}
                    onChange={(e) => setEditClientForm({ ...editClientForm, razonSocial: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00B594] focus:ring-1 focus:ring-[#00B594]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">RUC (Identificación Tributaria) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 20100123456"
                    maxLength={11}
                    value={editClientForm.ruc}
                    onChange={(e) => setEditClientForm({ ...editClientForm, ruc: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00B594] focus:ring-1 focus:ring-[#00B594] font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Dirección Sede</label>
                    <input
                      type="text"
                      placeholder="Ej: Av. El Derby 150"
                      value={editClientForm.direccionSede}
                      onChange={(e) => setEditClientForm({ ...editClientForm, direccionSede: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Distrito</label>
                    <input
                      type="text"
                      placeholder="Ej: Santiago de Surco"
                      value={editClientForm.distrito}
                      onChange={(e) => setEditClientForm({ ...editClientForm, distrito: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
                    />
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-[#00B594] font-mono">Datos del Contacto</h4>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Nombre Contacto</label>
                    <input
                      type="text"
                      placeholder="Ej: Ing. Carlos Mendoza"
                      value={editClientForm.contactoNombre}
                      onChange={(e) => setEditClientForm({ ...editClientForm, contactoNombre: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Email Contacto</label>
                      <input
                        type="email"
                        placeholder="Ej: carlos@repsol.pe"
                        value={editClientForm.contactoEmail}
                        onChange={(e) => setEditClientForm({ ...editClientForm, contactoEmail: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Teléfono</label>
                      <input
                        type="text"
                        placeholder="Ej: 998765432"
                        value={editClientForm.contactoTelefono}
                        onChange={(e) => setEditClientForm({ ...editClientForm, contactoTelefono: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingClient(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#00B594] hover:bg-[#009b7e] text-white font-black rounded-xl text-xs cursor-pointer shadow-[0_3px_8px_rgba(0,181,148,0.15)]"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL DETALLE / EDICIÓN CONTRATO */}
      {selectedContratoForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh] border border-slate-100 my-8">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Briefcase size={16} className="text-[#00B594]" />
                {isEditingContrato ? 'Editar Información del Contrato' : 'Ficha del Contrato / Acuerdo'}
              </h3>
              <button 
                onClick={() => setSelectedContratoForView(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {!isEditingContrato ? (
              /* MODO VISUALIZACIÓN */
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full inline-block border border-slate-200">
                      OT Marco #{selectedContratoForView.ot_marco}
                    </span>
                    <h4 className="text-sm font-black text-slate-800 mt-1">{selectedContratoForView.cliente}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold inline-block mt-0.5">{selectedContratoForView.tipo_servicio} • {selectedContratoForView.tipo_contrato}</span>
                  </div>
                  <div className="p-3 bg-[#E6F7F4] rounded-2xl border border-[#00B594]/10 shrink-0">
                    <Briefcase size={24} className="text-[#00B594]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Fecha de Inicio</span>
                    <span className="text-xs text-slate-700 font-bold block font-mono">{selectedContratoForView.fecha_inicio}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Fecha de Fin</span>
                    <span className="text-xs text-slate-700 font-bold block font-mono">{selectedContratoForView.fecha_fin}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Responsable Comercial</span>
                    <span className="text-xs text-slate-700 font-bold block">{selectedContratoForView.comercial}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Estado</span>
                    <span className="text-xs font-bold block">
                      <span className={`text-[9px] font-extrabold font-mono px-2 py-0.5 rounded-full uppercase ${
                        selectedContratoForView.estado === 'VIGENTE' ? 'bg-[#E6F7F4] text-[#00B594]' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {selectedContratoForView.estado}
                      </span>
                    </span>
                  </div>
                  <div className="col-span-full space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Comentarios / Alcance</span>
                    <p className="text-xs text-slate-650 font-medium bg-slate-50 p-3 rounded-xl border border-slate-150 whitespace-pre-line leading-relaxed">
                      {selectedContratoForView.comentarios || 'Sin comentarios adicionales.'}
                    </p>
                  </div>
                </div>

                {/* Sección Financiera (Consumo / Saldo) */}
                {selectedContratoForView.presupuesto_total_usd && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-[#00B594] font-mono">Consumo Presupuestal</h5>
                    {(() => {
                      const presupuesto = selectedContratoForView.presupuesto_total_usd!;
                      const saldo = selectedContratoForView.saldo_disponible_usd ?? presupuesto;
                      const consumo = presupuesto - saldo;
                      const pct = presupuesto > 0 ? (consumo / presupuesto) * 100 : 0;
                      
                      let progressColor = "bg-[#00B594]";
                      if (pct >= 95) progressColor = "bg-rose-500";
                      else if (pct >= 80) progressColor = "bg-amber-500";

                      return (
                        <div className="bg-slate-55 p-4 rounded-2xl border border-slate-150 space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-500">Porcentaje Consumido:</span>
                            <span className="text-slate-800">{pct.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div className={`h-2 rounded-full ${progressColor} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                            <div>
                              <span className="text-[9px] text-slate-400 block uppercase font-mono">Presupuesto</span>
                              <span className="font-mono font-bold text-slate-800">${presupuesto.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block uppercase font-mono">Consumido</span>
                              <span className="font-mono font-bold text-slate-800">${consumo.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block uppercase font-mono">Disponible</span>
                              <span className="font-mono font-black text-[#00B594]">${saldo.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Alerta de Sobregiro */}
                {selectedContratoForView.sobregiro && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="text-rose-500 shrink-0" size={16} />
                    <span>¡Este contrato se encuentra en sobregiro presupuestal! Por favor aplique una ampliación de presupuesto.</span>
                  </div>
                )}

                {/* Formulario de Ampliación de Saldo */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-[#00B594] font-mono">Aplicar Ampliación de Presupuesto</h5>
                  <form onSubmit={handleAplicarAmpliacion} className="flex gap-2">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Monto en USD (ej. 5000)"
                      value={montoAmpliacionInput}
                      onChange={(e) => setMontoAmpliacionInput(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00B594] font-mono"
                    />
                    <button
                      type="submit"
                      className="bg-[#00B594] hover:bg-[#009b7e] text-white text-[10px] font-black px-4 rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      Ampliar Saldo
                    </button>
                  </form>
                </div>

                {/* Tarifario Contractual */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-[#00B594] font-mono">Tarifario Contractual</h5>
                  
                  <div className="max-h-36 overflow-y-auto border border-slate-150 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 text-[10px] text-slate-400 font-bold uppercase font-mono">
                          <th className="py-2 px-3">Concepto / Repuesto</th>
                          <th className="py-2 px-3 text-right">Precio (USD)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tarifario.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="py-3 px-3 text-center text-slate-400 font-medium italic">Sin tarifas configuradas</td>
                          </tr>
                        ) : (
                          tarifario.map((t, idx) => (
                            <tr key={t.id || idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-700">{t.concepto}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">${t.precioUnitario.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <form onSubmit={handleAgregarTarifa} className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Concepto (ej. Hora Técnico)"
                      value={nuevoConceptoTarifario}
                      onChange={(e) => setNuevoConceptoTarifario(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-[#00B594]"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        placeholder="Precio (USD)"
                        value={nuevoPrecioTarifario}
                        onChange={(e) => setNuevoPrecioTarifario(e.target.value)}
                        className="w-24 bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-[#00B594] font-mono"
                      />
                      <button
                        type="submit"
                        className="bg-[#00B594] hover:bg-[#009b7e] text-white p-2 rounded-xl shrink-0 cursor-pointer flex items-center justify-center shadow-sm"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </form>
                </div>

                {/* Cobertura de Equipos */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-[#00B594] font-mono">Equipos Cubiertos (Cobertura)</h5>
                  
                  <div className="max-h-36 overflow-y-auto border border-slate-150 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 text-[10px] text-slate-400 font-bold uppercase font-mono">
                          <th className="py-2 px-3">Modelo</th>
                          <th className="py-2 px-3">Número de Serie</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipos.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="py-3 px-3 text-center text-slate-400 font-medium italic">Sin cobertura de equipos registrada</td>
                          </tr>
                        ) : (
                          equipos.map((eq, idx) => (
                            <tr key={eq.id || idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-700">{eq.equipoModelo}</td>
                              <td className="py-2 px-3 font-mono text-slate-650">{eq.serie}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <form onSubmit={handleAgregarEquipo} className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Modelo (ej. UPS Vertiv)"
                      value={nuevoEquipoModelo}
                      onChange={(e) => setNuevoEquipoModelo(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-[#00B594]"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="N/S (Serie)"
                        value={nuevoEquipoSerie}
                        onChange={(e) => setNuevoEquipoSerie(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-[#00B594]"
                      />
                      <button
                        type="submit"
                        className="bg-[#00B594] hover:bg-[#009b7e] text-white p-2 rounded-xl shrink-0 cursor-pointer flex items-center justify-center shadow-sm"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </form>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedContratoForView(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingContrato(true)}
                    className="px-5 py-2 bg-[#00B594] hover:bg-[#009b7e] text-white font-black rounded-xl text-xs cursor-pointer shadow-[0_3px_8px_rgba(0,181,148,0.15)] flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    Editar Contrato
                  </button>
                </div>
              </div>
            ) : (
              /* MODO EDICIÓN */
              <form onSubmit={handleContratoUpdateSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Asociar Cliente <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={editContratoForm.clientId}
                    onChange={(e) => setEditContratoForm({ ...editContratoForm, clientId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-[#00B594]"
                  >
                    <option value="">Seleccione cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.razonSocial}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">OT Marco Padre <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      required
                      placeholder="Ej: 1105"
                      value={editContratoForm.ot_marco}
                      onChange={(e) => setEditContratoForm({ ...editContratoForm, ot_marco: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Tipo Contratación</label>
                    <select
                      value={editContratoForm.tipo_servicio}
                      onChange={(e) => setEditContratoForm({ ...editContratoForm, tipo_servicio: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="CONTRATO">CONTRATO</option>
                      <option value="OC">ORDEN COMPRA (OC)</option>
                      <option value="OS">ORDEN SERVICIO (OS)</option>
                      <option value="CORREO">CORREO / ACUERDO</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Descripción del Alcance / Contrato <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Alquiler de UPS y visitas mensuales"
                    value={editContratoForm.tipo_contract}
                    onChange={(e) => setEditContratoForm({ ...editContratoForm, tipo_contract: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none font-sans"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Fecha Inicio</label>
                    <input
                      type="date"
                      value={editContratoForm.fecha_inicio}
                      onChange={(e) => setEditContratoForm({ ...editContratoForm, fecha_inicio: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Fecha Fin</label>
                    <input
                      type="date"
                      value={editContratoForm.fecha_fin}
                      onChange={(e) => setEditContratoForm({ ...editContratoForm, fecha_fin: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Responsable Comercial <span className="text-rose-500">*</span></label>
                    <select
                      required
                      value={editContratoForm.comercialId}
                      onChange={(e) => setEditContratoForm({ ...editContratoForm, comercialId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-[#00B594]"
                    >
                      <option value="">Seleccione comercial...</option>
                      {users.filter(u => u.role === 'Ventas' && u.estado === 'Activo').map(u => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Estado</label>
                    <select
                      value={editContratoForm.estado}
                      onChange={(e) => setEditContratoForm({ ...editContratoForm, estado: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="VIGENTE">VIGENTE</option>
                      <option value="TERMINADO">TERMINADO</option>
                      <option value="ANULADO">ANULADO</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Presupuesto Total (USD)</label>
                    <input
                      type="number"
                      placeholder="Ej: 5000"
                      value={editContratoForm.presupuesto_total_usd}
                      onChange={(e) => setEditContratoForm({ ...editContratoForm, presupuesto_total_usd: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Saldo Disponible (USD)</label>
                    <input
                      type="number"
                      placeholder="Ej: 2500"
                      value={editContratoForm.saldo_disponible_usd}
                      onChange={(e) => setEditContratoForm({ ...editContratoForm, saldo_disponible_usd: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Comentarios Adicionales</label>
                  <textarea
                    placeholder="Detalles del acuerdo, periodicidad de pagos, etc..."
                    rows={2}
                    value={editContratoForm.comentarios}
                    onChange={(e) => setEditContratoForm({ ...editContratoForm, comentarios: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingContrato(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#00B594] hover:bg-[#009b7e] text-white font-black rounded-xl text-xs cursor-pointer shadow-[0_3px_8px_rgba(0,181,148,0.15)]"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
