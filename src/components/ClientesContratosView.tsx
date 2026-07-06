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
  onAddContrato: (newContrato: Contrato) => void;
  onUpdateContrato?: (updated: Contrato) => void;
}

export default function ClientesContratosView({
  clients,
  contratos,
  users = [],
  currentUser,
  onAddClient,
  onAddContrato,
  onUpdateContrato
}: ClientesContratosViewProps) {
  const [activeTab, setActiveTab] = useState<'clientes' | 'contratos'>('clientes');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal controllers
  const [showClientModal, setShowClientModal] = useState(false);
  const [showContratoModal, setShowContratoModal] = useState(false);

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
    comentarios: ''
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

  const handleContratoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contratoForm.clientId || !contratoForm.ot_marco) return;

    const matchedClient = clients.find(c => c.id === contratoForm.clientId);
    const matchedComercial = users.find(u => u.id === contratoForm.comercialId);

    const newContrato: Contrato = {
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
      comentarios: contratoForm.comentarios.trim() || ''
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
      comentarios: ''
    });
    setShowContratoModal(false);
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

        {/* Search */}
        <div className="relative max-w-xs w-full mb-2">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input
            type="text"
            placeholder={activeTab === 'clientes' ? "Buscar por razón social, ruc, distrito..." : "Buscar por cliente, comercial, ot marco..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-55 border border-slate-200 rounded-2xl py-1.5 pl-9 pr-4 text-xs text-slate-750 focus:outline-none focus:ring-1 focus:ring-[#00B594]"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'clientes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-450 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <Building2 size={40} className="mx-auto mb-3 opacity-30 text-slate-500" />
              <p className="text-xs font-bold">No se encontraron clientes.</p>
              <p className="text-[10px] mt-1 text-slate-400">Intenta cambiar el criterio de búsqueda o registra uno nuevo.</p>
            </div>
          ) : (
            filteredClients.map((client) => {
              // count active contracts
              const clientContracts = contratos.filter(c => c.cliente === client.razonSocial);
              return (
                <div 
                  key={client.id} 
                  className="bg-white border border-slate-150 rounded-3xl p-5 hover:border-[#00B594]/40 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <Building2 size={18} className="text-[#00B594]" />
                      </div>
                      <span className="text-[9px] font-extrabold uppercase font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        RUC {client.ruc}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 line-clamp-2" title={client.razonSocial}>
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
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContratos.length === 0 ? (
            <div className="py-12 text-center text-slate-450 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <Briefcase size={40} className="mx-auto mb-3 opacity-30 text-slate-500" />
              <p className="text-xs font-bold">No se encontraron contratos registrados.</p>
              <p className="text-[10px] mt-1 text-slate-400">Intenta registrar un contrato o cambiar la consulta de búsqueda.</p>
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
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContratos.map((contrato) => (
                    <tr key={contrato.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="text-xs font-black text-slate-800">{contrato.cliente}</div>
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
    </div>
  );
}
