import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Trash2,
  XCircle,
  Cloud
} from 'lucide-react';
import { Client, Contrato, User, ContratoAmpliacion, Equipo, OT, TechnicalReport } from '../types';
import EquipoPickerModal from './EquipoPickerModal';
import EquipoDetailDrawer from './EquipoDetailDrawer';
import DocumentFormat from './DocumentFormat';

const DEFAULT_PAISES = [
  { id: 'PER', nombre: 'Perú' },
  { id: 'CHL', nombre: 'Chile' },
  { id: 'COL', nombre: 'Colombia' },
  { id: 'MEX', nombre: 'México' }
];

const DEFAULT_PROVINCIAS = [
  { id: '1501', nombre: 'Lima', paisId: 'PER' },
  { id: '0701', nombre: 'Callao', paisId: 'PER' },
  { id: '0401', nombre: 'Arequipa', paisId: 'PER' },
  { id: '1301', nombre: 'Trujillo', paisId: 'PER' },
  { id: '1401', nombre: 'Chiclayo', paisId: 'PER' },
  { id: '2001', nombre: 'Piura', paisId: 'PER' },
  { id: '0801', nombre: 'Cusco', paisId: 'PER' },
  { id: '1201', nombre: 'Huancayo', paisId: 'PER' },
  { id: '1101', nombre: 'Ica', paisId: 'PER' },
  { id: '2301', nombre: 'Tacna', paisId: 'PER' },
  { id: '0601', nombre: 'Cajamarca', paisId: 'PER' },
  { id: '1601', nombre: 'Maynas (Iquitos)', paisId: 'PER' },
  { id: '2501', nombre: 'Coronel Portillo (Pucallpa)', paisId: 'PER' },
  { id: '0218', nombre: 'Santa (Chimbote)', paisId: 'PER' },
  { id: '2101', nombre: 'Puno', paisId: 'PER' },
  { id: '1001', nombre: 'Huánuco', paisId: 'PER' },
  { id: '0501', nombre: 'Huamanga (Ayacucho)', paisId: 'PER' },
  { id: '2209', nombre: 'San Martín (Tarapoto)', paisId: 'PER' },
  { id: '0201', nombre: 'Huaraz', paisId: 'PER' },
  { id: '2401', nombre: 'Tumbes', paisId: 'PER' },
  { id: '1801', nombre: 'Mariscal Nieto (Moquegua)', paisId: 'PER' },
  { id: '1102', nombre: 'Chincha', paisId: 'PER' },
  { id: '1505', nombre: 'Cañete', paisId: 'PER' },
  { id: '1506', nombre: 'Huaral', paisId: 'PER' },
  { id: '1502', nombre: 'Barranca', paisId: 'PER' }
];

const PROVINCIA_DISTRITOS_MAP: Record<string, Array<{ id: string; nombre: string; provinciaId: string }>> = {
  // Lima (1501)
  '1501': [
    { id: '150101', nombre: 'Lima (Cercado)', provinciaId: '1501' },
    { id: '150122', nombre: 'Miraflores', provinciaId: '1501' },
    { id: '150131', nombre: 'San Isidro', provinciaId: '1501' },
    { id: '150140', nombre: 'Santiago de Surco', provinciaId: '1501' },
    { id: '150130', nombre: 'San Borja', provinciaId: '1501' },
    { id: '150114', nombre: 'La Molina', provinciaId: '1501' },
    { id: '150121', nombre: 'Magdalena del Mar', provinciaId: '1501' },
    { id: '150136', nombre: 'San Miguel', provinciaId: '1501' },
    { id: '150113', nombre: 'Jesús María', provinciaId: '1501' },
    { id: '150116', nombre: 'Lince', provinciaId: '1501' },
    { id: '150104', nombre: 'Barranco', provinciaId: '1501' },
    { id: '150108', nombre: 'Chorrillos', provinciaId: '1501' },
    { id: '150128', nombre: 'Pueblo Libre', provinciaId: '1501' },
    { id: '150141', nombre: 'Surquillo', provinciaId: '1501' },
    { id: '150115', nombre: 'La Victoria', provinciaId: '1501' },
    { id: '150105', nombre: 'Breña', provinciaId: '1501' },
    { id: '150129', nombre: 'Rímac', provinciaId: '1501' },
    { id: '150132', nombre: 'San Juan de Lurigancho', provinciaId: '1501' },
    { id: '150133', nombre: 'San Juan de Miraflores', provinciaId: '1501' },
    { id: '150138', nombre: 'Santa Anita', provinciaId: '1501' },
    { id: '150103', nombre: 'Ate', provinciaId: '1501' },
    { id: '150110', nombre: 'Comas', provinciaId: '1501' },
    { id: '150117', nombre: 'Los Olivos', provinciaId: '1501' },
    { id: '150112', nombre: 'Independencia', provinciaId: '1501' },
    { id: '150135', nombre: 'San Martín de Porres', provinciaId: '1501' },
    { id: '150142', nombre: 'Villa El Salvador', provinciaId: '1501' },
    { id: '150143', nombre: 'Villa María del Triunfo', provinciaId: '1501' },
    { id: '150107', nombre: 'Chaclacayo', provinciaId: '1501' },
    { id: '150109', nombre: 'Cieneguilla', provinciaId: '1501' },
    { id: '150111', nombre: 'El Agustino', provinciaId: '1501' },
    { id: '150119', nombre: 'Lurín', provinciaId: '1501' },
    { id: '150123', nombre: 'Pachacámac', provinciaId: '1501' },
    { id: '150124', nombre: 'Pucusana', provinciaId: '1501' },
    { id: '150125', nombre: 'Puente Piedra', provinciaId: '1501' },
    { id: '150126', nombre: 'Punta Hermosa', provinciaId: '1501' },
    { id: '150127', nombre: 'Punta Negra', provinciaId: '1501' },
    { id: '150134', nombre: 'San Bartolo', provinciaId: '1501' },
    { id: '150139', nombre: 'Santa María del Mar', provinciaId: '1501' },
    { id: '150144', nombre: 'Santa Rosa', provinciaId: '1501' },
    { id: '150102', nombre: 'Ancón', provinciaId: '1501' },
    { id: '150106', nombre: 'Carabayllo', provinciaId: '1501' }
  ],
  // Callao (0701)
  '0701': [
    { id: '070101', nombre: 'Callao (Cercado)', provinciaId: '0701' },
    { id: '070102', nombre: 'Bellavista', provinciaId: '0701' },
    { id: '070103', nombre: 'Carmen de la Legua Reynoso', provinciaId: '0701' },
    { id: '070104', nombre: 'La Perla', provinciaId: '0701' },
    { id: '070105', nombre: 'La Punta', provinciaId: '0701' },
    { id: '070106', nombre: 'Ventanilla', provinciaId: '0701' },
    { id: '070107', nombre: 'Mi Perú', provinciaId: '0701' }
  ],
  // Arequipa (0401)
  '0401': [
    { id: '040101', nombre: 'Arequipa (Cercado)', provinciaId: '0401' },
    { id: '040102', nombre: 'Alto Selva Alegre', provinciaId: '0401' },
    { id: '040103', nombre: 'Cayma', provinciaId: '0401' },
    { id: '040104', nombre: 'Cerro Colorado', provinciaId: '0401' },
    { id: '040105', nombre: 'Characato', provinciaId: '0401' },
    { id: '040107', nombre: 'Jacobo Hunter', provinciaId: '0401' },
    { id: '040108', nombre: 'José Luis Bustamante y Rivero', provinciaId: '0401' },
    { id: '040109', nombre: 'Mariano Melgar', provinciaId: '0401' },
    { id: '040110', nombre: 'Miraflores (Arequipa)', provinciaId: '0401' },
    { id: '040112', nombre: 'Paucarpata', provinciaId: '0401' },
    { id: '040113', nombre: 'Pocsi', provinciaId: '0401' },
    { id: '040114', nombre: 'Polobaya', provinciaId: '0401' },
    { id: '040115', nombre: 'Quequeña', provinciaId: '0401' },
    { id: '040116', nombre: 'Sabandia', provinciaId: '0401' },
    { id: '040117', nombre: 'Sachaca', provinciaId: '0401' },
    { id: '040119', nombre: 'Socabaya', provinciaId: '0401' },
    { id: '040120', nombre: 'Tiabaya', provinciaId: '0401' },
    { id: '040126', nombre: 'Yanahuara', provinciaId: '0401' }
  ],
  // Trujillo (1301)
  '1301': [
    { id: '130101', nombre: 'Trujillo', provinciaId: '1301' },
    { id: '130102', nombre: 'El Porvenir', provinciaId: '1301' },
    { id: '130103', nombre: 'Florencia de Mora', provinciaId: '1301' },
    { id: '130104', nombre: 'Huanchaco', provinciaId: '1301' },
    { id: '130105', nombre: 'La Esperanza', provinciaId: '1301' },
    { id: '130106', nombre: 'Laredo', provinciaId: '1301' },
    { id: '130107', nombre: 'Moche', provinciaId: '1301' },
    { id: '130109', nombre: 'Salaverry', provinciaId: '1301' },
    { id: '130111', nombre: 'Víctor Larco Herrera', provinciaId: '1301' }
  ],
  // Chiclayo (1401)
  '1401': [
    { id: '140101', nombre: 'Chiclayo', provinciaId: '1401' },
    { id: '140102', nombre: 'Chongoyape', provinciaId: '1401' },
    { id: '140103', nombre: 'Eten', provinciaId: '1401' },
    { id: '140106', nombre: 'José Leonardo Ortiz', provinciaId: '1401' },
    { id: '140107', nombre: 'La Victoria', provinciaId: '1401' },
    { id: '140108', nombre: 'Lagunas', provinciaId: '1401' },
    { id: '140109', nombre: 'Monsefú', provinciaId: '1401' },
    { id: '140112', nombre: 'Pimentel', provinciaId: '1401' },
    { id: '140113', nombre: 'Reque', provinciaId: '1401' },
    { id: '140114', nombre: 'Santa Rosa', provinciaId: '1401' },
    { id: '140116', nombre: 'Pomalca', provinciaId: '1401' },
    { id: '140117', nombre: 'Pucalá', provinciaId: '1401' },
    { id: '140118', nombre: 'Patapo', provinciaId: '1401' },
    { id: '140119', nombre: 'Tumán', provinciaId: '1401' }
  ],
  // Piura (2001)
  '2001': [
    { id: '200101', nombre: 'Piura', provinciaId: '2001' },
    { id: '200104', nombre: 'Castilla', provinciaId: '2001' },
    { id: '200105', nombre: 'Catacaos', provinciaId: '2001' },
    { id: '200107', nombre: 'Cura Mori', provinciaId: '2001' },
    { id: '200108', nombre: 'El Tallán', provinciaId: '2001' },
    { id: '200109', nombre: 'La Arena', provinciaId: '2001' },
    { id: '200110', nombre: 'La Unión', provinciaId: '2001' },
    { id: '200111', nombre: 'Las Lomas', provinciaId: '2001' },
    { id: '200114', nombre: 'Tambo Grande', provinciaId: '2001' },
    { id: '200115', nombre: 'Veintiséis de Octubre', provinciaId: '2001' }
  ],
  // Cusco (0801)
  '0801': [
    { id: '080101', nombre: 'Cusco', provinciaId: '0801' },
    { id: '080102', nombre: 'Ccorca', provinciaId: '0801' },
    { id: '080103', nombre: 'Poroy', provinciaId: '0801' },
    { id: '080104', nombre: 'San Jerónimo', provinciaId: '0801' },
    { id: '080105', nombre: 'San Sebastián', provinciaId: '0801' },
    { id: '080106', nombre: 'Santiago', provinciaId: '0801' },
    { id: '080107', nombre: 'Saylla', provinciaId: '0801' },
    { id: '080108', nombre: 'Wanchaq', provinciaId: '0801' }
  ],
  // Huancayo (1201)
  '1201': [
    { id: '120101', nombre: 'Huancayo', provinciaId: '1201' },
    { id: '120107', nombre: 'Chilca', provinciaId: '1201' },
    { id: '120114', nombre: 'El Tambo', provinciaId: '1201' },
    { id: '120119', nombre: 'Huancán', provinciaId: '1201' },
    { id: '120127', nombre: 'Pilcomayo', provinciaId: '1201' },
    { id: '120129', nombre: 'San Agustín', provinciaId: '1201' },
    { id: '120130', nombre: 'San Jerónimo de Tunán', provinciaId: '1201' },
    { id: '120132', nombre: 'Sapallanga', provinciaId: '1201' },
    { id: '120133', nombre: 'Sicaya', provinciaId: '1201' }
  ],
  // Ica (1101)
  '1101': [
    { id: '110101', nombre: 'Ica', provinciaId: '1101' },
    { id: '110102', nombre: 'La Tinguiña', provinciaId: '1101' },
    { id: '110103', nombre: 'Los Aquijes', provinciaId: '1101' },
    { id: '110105', nombre: 'Parcona', provinciaId: '1101' },
    { id: '110106', nombre: 'Pueblo Nuevo', provinciaId: '1101' },
    { id: '110107', nombre: 'Salas', provinciaId: '1101' },
    { id: '110108', nombre: 'San José de Los Molinos', provinciaId: '1101' },
    { id: '110109', nombre: 'San Juan Bautista', provinciaId: '1101' },
    { id: '110110', nombre: 'Santiago', provinciaId: '1101' },
    { id: '110111', nombre: 'Subtanjalla', provinciaId: '1101' }
  ],
  // Tacna (2301)
  '2301': [
    { id: '230101', nombre: 'Tacna', provinciaId: '2301' },
    { id: '230102', nombre: 'Alto de la Alianza', provinciaId: '2301' },
    { id: '230103', nombre: 'Calana', provinciaId: '2301' },
    { id: '230104', nombre: 'Ciudad Nueva', provinciaId: '2301' },
    { id: '230106', nombre: 'Pachía', provinciaId: '2301' },
    { id: '230108', nombre: 'Pocollay', provinciaId: '2301' },
    { id: '230110', nombre: 'Coronel Gregorio Albarracín', provinciaId: '2301' }
  ],
  // Cajamarca (0601)
  '0601': [
    { id: '060101', nombre: 'Cajamarca', provinciaId: '0601' },
    { id: '060103', nombre: 'Baños del Inca', provinciaId: '0601' },
    { id: '060106', nombre: 'Jesús', provinciaId: '0601' },
    { id: '060107', nombre: 'Llacanora', provinciaId: '0601' },
    { id: '060108', nombre: 'Los Baños del Inca', provinciaId: '0601' }
  ],
  // Maynas / Iquitos (1601)
  '1601': [
    { id: '160101', nombre: 'Iquitos', provinciaId: '1601' },
    { id: '160102', nombre: 'Alto Nanay', provinciaId: '1601' },
    { id: '160108', nombre: 'Punchana', provinciaId: '1601' },
    { id: '160112', nombre: 'Belén', provinciaId: '1601' },
    { id: '160113', nombre: 'San Juan Bautista (Maynas)', provinciaId: '1601' }
  ],
  // Coronel Portillo / Pucallpa (2501)
  '2501': [
    { id: '250101', nombre: 'Callería (Pucallpa)', provinciaId: '2501' },
    { id: '250102', nombre: 'Campoverde', provinciaId: '2501' },
    { id: '250104', nombre: 'Yarinacocha', provinciaId: '2501' },
    { id: '250105', nombre: 'Manantay', provinciaId: '2501' }
  ],
  // Santa / Chimbote (0218)
  '0218': [
    { id: '021801', nombre: 'Chimbote', provinciaId: '0218' },
    { id: '021804', nombre: 'Coishco', provinciaId: '0218' },
    { id: '021806', nombre: 'Nepeña', provinciaId: '0218' },
    { id: '021808', nombre: 'Santa', provinciaId: '0218' },
    { id: '021809', nombre: 'Nuevo Chimbote', provinciaId: '0218' }
  ],
  // Puno (2101)
  '2101': [
    { id: '210101', nombre: 'Puno (Cercado)', provinciaId: '2101' },
    { id: '210102', nombre: 'Acora', provinciaId: '2101' },
    { id: '210104', nombre: 'Capachica', provinciaId: '2101' },
    { id: '210105', nombre: 'Chucuito', provinciaId: '2101' },
    { id: '210111', nombre: 'Paucarcolla', provinciaId: '2101' },
    { id: '210112', nombre: 'Platería', provinciaId: '2101' },
    { id: '210114', nombre: 'San Antonio (Puno)', provinciaId: '2101' },
    { id: '211101', nombre: 'Juliaca (San Román)', provinciaId: '2101' }
  ],
  // Huánuco (1001)
  '1001': [
    { id: '100101', nombre: 'Huánuco', provinciaId: '1001' },
    { id: '100102', nombre: 'Amarilis', provinciaId: '1001' },
    { id: '100111', nombre: 'Pillco Marca', provinciaId: '1001' },
    { id: '100112', nombre: 'Santa María del Valle', provinciaId: '1001' }
  ],
  // Huamanga / Ayacucho (0501)
  '0501': [
    { id: '050101', nombre: 'Ayacucho', provinciaId: '0501' },
    { id: '050103', nombre: 'Carmen Alto', provinciaId: '0501' },
    { id: '050107', nombre: 'San Juan Bautista (Ayacucho)', provinciaId: '0501' },
    { id: '050114', nombre: 'Jesús Nazareno', provinciaId: '0501' },
    { id: '050115', nombre: 'Andrés Avelino Cáceres', provinciaId: '0501' }
  ],
  // San Martín / Tarapoto (2209)
  '2209': [
    { id: '220901', nombre: 'Tarapoto', provinciaId: '2209' },
    { id: '220906', nombre: 'La Banda de Shilcayo', provinciaId: '2209' },
    { id: '220910', nombre: 'Morales', provinciaId: '2209' },
    { id: '220904', nombre: 'Cacatachi', provinciaId: '2209' }
  ],
  // Huaraz (0201)
  '0201': [
    { id: '020101', nombre: 'Huaraz', provinciaId: '0201' },
    { id: '020107', nombre: 'Independencia (Huaraz)', provinciaId: '0201' },
    { id: '020111', nombre: 'Tarica', provinciaId: '0201' }
  ],
  // Tumbes (2401)
  '2401': [
    { id: '240101', nombre: 'Tumbes', provinciaId: '2401' },
    { id: '240102', nombre: 'Corrales', provinciaId: '2401' },
    { id: '240103', nombre: 'La Cruz', provinciaId: '2401' },
    { id: '240106', nombre: 'San Juan de la Virgen', provinciaId: '2401' }
  ],
  // Mariscal Nieto / Moquegua (1801)
  '1801': [
    { id: '180101', nombre: 'Moquegua', provinciaId: '1801' },
    { id: '180105', nombre: 'Samegua', provinciaId: '1801' },
    { id: '180106', nombre: 'Torata', provinciaId: '1801' }
  ],
  // Chincha (1102)
  '1102': [
    { id: '110201', nombre: 'Chincha Alta', provinciaId: '1102' },
    { id: '110202', nombre: 'Alto Larán', provinciaId: '1102' },
    { id: '110204', nombre: 'Chincha Baja', provinciaId: '1102' },
    { id: '110205', nombre: 'El Carmen', provinciaId: '1102' },
    { id: '110206', nombre: 'Grocio Prado', provinciaId: '1102' },
    { id: '110207', nombre: 'Pueblo Nuevo (Chincha)', provinciaId: '1102' },
    { id: '110208', nombre: 'Sunampe', provinciaId: '1102' },
    { id: '110209', nombre: 'Tambo de Mora', provinciaId: '1102' }
  ],
  // Cañete (1505)
  '1505': [
    { id: '150501', nombre: 'San Vicente de Cañete', provinciaId: '1505' },
    { id: '150502', nombre: 'Asia', provinciaId: '1505' },
    { id: '150504', nombre: 'Cerro Azul', provinciaId: '1505' },
    { id: '150505', nombre: 'Chilca (Cañete)', provinciaId: '1505' },
    { id: '150507', nombre: 'Imperial', provinciaId: '1505' },
    { id: '150508', nombre: 'Lunahuaná', provinciaId: '1505' },
    { id: '150509', nombre: 'Mala', provinciaId: '1505' },
    { id: '150510', nombre: 'Nuevo Imperial', provinciaId: '1505' },
    { id: '150512', nombre: 'Quilmaná', provinciaId: '1505' },
    { id: '150513', nombre: 'San Antonio (Cañete)', provinciaId: '1505' },
    { id: '150514', nombre: 'San Luis (Cañete)', provinciaId: '1505' },
    { id: '150515', nombre: 'Santa Cruz de Flores', provinciaId: '1505' }
  ],
  // Huaral (1506)
  '1506': [
    { id: '150601', nombre: 'Huaral', provinciaId: '1506' },
    { id: '150604', nombre: 'Aucallama', provinciaId: '1506' },
    { id: '150605', nombre: 'Chancay', provinciaId: '1506' }
  ],
  // Barranca (1502)
  '1502': [
    { id: '150201', nombre: 'Barranca', provinciaId: '1502' },
    { id: '150202', nombre: 'Paramonga', provinciaId: '1502' },
    { id: '150203', nombre: 'Pativilca', provinciaId: '1502' },
    { id: '150204', nombre: 'Supe', provinciaId: '1502' },
    { id: '150205', nombre: 'Supe Puerto', provinciaId: '1502' }
  ]
};

const getFallbackDistritos = (provInput: string) => {
  if (!provInput) return [];
  const raw = provInput.trim().toLowerCase();

  // 1. Direct ID match in map
  if (PROVINCIA_DISTRITOS_MAP[provInput]) {
    return PROVINCIA_DISTRITOS_MAP[provInput];
  }

  // 2. Exact keyword / province resolution
  if (raw.includes('puno') || raw.includes('juliaca') || raw === '2101') return PROVINCIA_DISTRITOS_MAP['2101'];
  if (raw.includes('callao') || raw === '0701') return PROVINCIA_DISTRITOS_MAP['0701'];
  if (raw.includes('arequipa') || raw === '0401') return PROVINCIA_DISTRITOS_MAP['0401'];
  if (raw.includes('trujillo') || raw === '1301') return PROVINCIA_DISTRITOS_MAP['1301'];
  if (raw.includes('chiclayo') || raw === '1401') return PROVINCIA_DISTRITOS_MAP['1401'];
  if (raw.includes('piura') || raw === '2001') return PROVINCIA_DISTRITOS_MAP['2001'];
  if (raw.includes('cusco') || raw === '0801') return PROVINCIA_DISTRITOS_MAP['0801'];
  if (raw.includes('huancayo') || raw === '1201') return PROVINCIA_DISTRITOS_MAP['1201'];
  if (raw.includes('chincha') || raw === '1102') return PROVINCIA_DISTRITOS_MAP['1102'];
  if (raw.includes('ica') || raw === '1101') return PROVINCIA_DISTRITOS_MAP['1101'];
  if (raw.includes('tacna') || raw === '2301') return PROVINCIA_DISTRITOS_MAP['2301'];
  if (raw.includes('cajamarca') || raw === '0601') return PROVINCIA_DISTRITOS_MAP['0601'];
  if (raw.includes('iquitos') || raw.includes('maynas') || raw === '1601') return PROVINCIA_DISTRITOS_MAP['1601'];
  if (raw.includes('pucallpa') || raw.includes('portillo') || raw === '2501') return PROVINCIA_DISTRITOS_MAP['2501'];
  if (raw.includes('chimbote') || raw.includes('santa') || raw === '0218') return PROVINCIA_DISTRITOS_MAP['0218'];
  if (raw.includes('huánuco') || raw.includes('huanuco') || raw === '1001') return PROVINCIA_DISTRITOS_MAP['1001'];
  if (raw.includes('ayacucho') || raw.includes('huamanga') || raw === '0501') return PROVINCIA_DISTRITOS_MAP['0501'];
  if (raw.includes('tarapoto') || raw.includes('san mart') || raw === '2209') return PROVINCIA_DISTRITOS_MAP['2209'];
  if (raw.includes('huaraz') || raw === '0201') return PROVINCIA_DISTRITOS_MAP['0201'];
  if (raw.includes('tumbes') || raw === '2401') return PROVINCIA_DISTRITOS_MAP['2401'];
  if (raw.includes('moquegua') || raw.includes('nieto') || raw === '1801') return PROVINCIA_DISTRITOS_MAP['1801'];
  if (raw.includes('cañete') || raw.includes('canete') || raw === '1505') return PROVINCIA_DISTRITOS_MAP['1505'];
  if (raw.includes('huaral') || raw === '1506') return PROVINCIA_DISTRITOS_MAP['1506'];
  if (raw.includes('barranca') || raw === '1502') return PROVINCIA_DISTRITOS_MAP['1502'];
  if (raw.includes('lima') || raw === '1501') return PROVINCIA_DISTRITOS_MAP['1501'];

  // Generic fallback if unknown province
  const cleanProv = provInput.replace(/\(.*\)/, '').trim();
  return [
    { id: `${provInput}-01`, nombre: `${cleanProv} (Cercado/Centro)`, provinciaId: provInput },
    { id: `${provInput}-02`, nombre: `${cleanProv} Norte`, provinciaId: provInput },
    { id: `${provInput}-03`, nombre: `${cleanProv} Sur`, provinciaId: provInput },
    { id: `${provInput}-04`, nombre: `${cleanProv} Este`, provinciaId: provInput },
    { id: `${provInput}-05`, nombre: `${cleanProv} Oeste`, provinciaId: provInput }
  ];
};

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
  
  // Custom Alert Modal Controller
  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'offline';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });
  
  // Custom Confirmation Modal Controller
  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    show: false,
    title: '',
    message: ''
  });
  
  // Modal controllers
  const [showClientModal, setShowClientModal] = useState(false);
  const [showContratoModal, setShowContratoModal] = useState(false);
  const [selectedClientForView, setSelectedClientForView] = useState<Client | null>(null);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [showAmpliacionModal, setShowAmpliacionModal] = useState(false);
  const [ampliacionForm, setAmpliacionForm] = useState({
    monto: '',
    fecha_inicio: '',
    fecha_fin: '',
    comentarios: '',
    adenda_pdf_base64: '',
    adenda_pdf_name: ''
  });
  const [ampliacionLoading, setAmpliacionLoading] = useState(false);
  const [editingAmpliacionId, setEditingAmpliacionId] = useState<string | null>(null);

  // Equipment state
  const [contratoEquipos, setContratoEquipos] = useState<Equipo[]>([]);
  const [equiposLoading, setEquiposLoading] = useState(false);
  const [showEquipoPicker, setShowEquipoPicker] = useState(false);
  const [selectedEquipoId, setSelectedEquipoId] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<'contrato' | 'adenda'>('contrato');
  const [adendaPendingEquipos, setAdendaPendingEquipos] = useState<Equipo[]>([]);

  // PDF report generation from equipment service history
  const [pdfReporteOt, setPdfReporteOt] = useState<OT | null>(null);
  const [pdfReporteReport, setPdfReporteReport] = useState<TechnicalReport | null>(null);
  const [pdfReporteClient, setPdfReporteClient] = useState<Client | null>(null);
  const [isGeneratingReportePdf, setIsGeneratingReportePdf] = useState(false);

  // Client form state
  const [clientForm, setClientForm] = useState({
    id: '',
    razonSocial: '',
    ruc: '',
    direccionSede: '',
    distrito: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: '',
    pais: '',
    provincia: '',
    contactos: [] as Array<{ nombre: string; email: string; telefono: string }>
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
    contactoTelefono: '',
    pais: '',
    provincia: '',
    contactos: [] as Array<{ nombre: string; email: string; telefono: string }>
  });

  // Ubigeo state
  const [paises, setPaises] = useState<any[]>([]);
  const [provincias, setProvincias] = useState<any[]>([]);
  const [distritos, setDistritos] = useState<any[]>([]);
  const [tipoContratos, setTipoContratos] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/tipo-contratos')
      .then(r => r.ok ? r.json() : [])
      .then(data => setTipoContratos(Array.isArray(data) ? data : []))
      .catch(() => setTipoContratos([]));
  }, []);

  const getContractPdfUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const token = localStorage.getItem('gestia_jwt_token');
    let cleanKey = url;
    if (cleanKey.startsWith('/uploads/')) {
      cleanKey = cleanKey.replace('/uploads/', '').replace(/^contracts-/, 'contracts/');
    }
    cleanKey = cleanKey.replace(/^\/api\/contracts\/files\//, '').replace(/^\/+/, '');
    if (!cleanKey.startsWith('contracts/')) {
      cleanKey = `contracts/${cleanKey}`;
    }
    return `/api/contracts/files/${cleanKey}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  };

  useEffect(() => {
    fetch('/api/ubigeo/paises')
      .then(r => r.json())
      .then(data => setPaises(Array.isArray(data) && data.length > 0 ? data : DEFAULT_PAISES))
      .catch(() => setPaises(DEFAULT_PAISES));
  }, []);

  const activePais = clientForm.pais || editClientForm.pais;
  const activeProv = clientForm.provincia || editClientForm.provincia;

  useEffect(() => {
    if (activePais) {
      fetch(`/api/ubigeo/provincias?paisId=${encodeURIComponent(activePais)}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setProvincias(data);
          } else {
            setProvincias(DEFAULT_PROVINCIAS);
          }
        })
        .catch(() => setProvincias(DEFAULT_PROVINCIAS));
    } else {
      setProvincias([]);
    }
  }, [activePais]);

  useEffect(() => {
    if (activeProv) {
      const provQuery = activeProv.trim();
      fetch(`/api/ubigeo/distritos?provinciaId=${encodeURIComponent(provQuery)}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setDistritos(data);
          } else {
            setDistritos(getFallbackDistritos(provQuery));
          }
        })
        .catch(() => {
          setDistritos(getFallbackDistritos(provQuery));
        });
    } else {
      setDistritos([]);
    }
  }, [activeProv]);

  // Contrato form state
  const [contratoForm, setContratoForm] = useState({
    clientId: '',
    tipo_contract: '',
    tipo_contrato: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'VIGENTE' as const,
    comercialId: '',
    comentarios: '',
    monto_original: '',
    moneda: 'USD',
    pdf_base64: '',
    pdf_name: ''
  });

  const [contratoViewMode, setContratoViewMode] = useState<'list' | 'grid'>('list');
  const [selectedContratoForView, setSelectedContratoForView] = useState<Contrato | null>(null);
  const [isEditingContrato, setIsEditingContrato] = useState(false);

  const anyModalOpen = showClientModal || showContratoModal || showAmpliacionModal || showEquipoPicker || !!selectedClientForView || !!selectedContratoForView || !!selectedEquipoId;
  useEffect(() => {
    const el = document.getElementById('main-workspace-content');
    if (!el) return;
    if (anyModalOpen) {
      el.style.overflow = 'hidden';
    } else {
      el.style.overflow = '';
    }
    return () => { if (el) el.style.overflow = ''; };
  }, [anyModalOpen]);

  const [editContratoForm, setEditContratoForm] = useState({
    id: '',
    clientId: '',
    tipo_contract: '',
    tipo_contrato: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'VIGENTE' as string,
    comercialId: '',
    comentarios: '',
    presupuesto_total_usd: '',
    saldo_disponible_usd: '',
    monto_original: '',
    moneda: 'USD',
    pdf_base64: '',
    pdf_name: ''
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
      comercialName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.razonSocial || !clientForm.ruc) return;

    const finalId = clientForm.id.trim().toUpperCase() || generateClientCode(clientForm.razonSocial.trim(), clients);

    // Validate uniqueness in frontend list
    const isDuplicate = clients.some(c => c.id.toUpperCase() === finalId.toUpperCase());
    if (isDuplicate) {
      setAlertState({
        show: true,
        type: 'error',
        title: 'Código Duplicado',
        message: `El código de cliente '${finalId}' ya existe en el sistema. Por favor, asigne uno único.`
      });
      return;
    }

    const newClient: Client = {
      id: finalId,
      razonSocial: clientForm.razonSocial.trim(),
      ruc: clientForm.ruc.trim(),
      direccionSede: clientForm.direccionSede.trim() || 'No especificada',
      distrito: clientForm.distrito.trim() || 'Lima',
      contactoNombre: clientForm.contactoNombre.trim() || 'No especificado',
      contactoEmail: clientForm.contactoEmail.trim() || 'No especificado',
      contactoTelefono: clientForm.contactoTelefono.trim() || 'No especificado',
      pais: clientForm.pais || '',
      provincia: clientForm.provincia || '',
      contactos: clientForm.contactos || []
    };

    try {
      await onAddClient(newClient);
      setAlertState({
        show: true,
        type: 'success',
        title: 'Registro Exitoso',
        message: '¡El cliente ha sido registrado con éxito en la base de datos!'
      });
      setClientForm({
        id: '',
        razonSocial: '',
        ruc: '',
        direccionSede: '',
        distrito: '',
        contactoNombre: '',
        contactoEmail: '',
        contactoTelefono: '',
        pais: '',
        provincia: '',
        contactos: []
      });
      setShowClientModal(false);
    } catch (err: any) {
      if (err.message === "offline") {
        setAlertState({
          show: true,
          type: 'error',
          title: 'Error de Conexión',
          message: 'No se pudo registrar el cliente: sin conexión con el servidor. El cliente NO fue guardado. Verifique su conexión e intente de nuevo.'
        });
      } else {
        setAlertState({
          show: true,
          type: 'error',
          title: 'Error de Registro',
          message: 'No se pudo registrar el cliente: ' + (err.message || "Error desconocido")
        });
      }
    }
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
      contactoTelefono: client.contactoTelefono,
      pais: client.pais || '',
      provincia: client.provincia || '',
      contactos: client.contactos || []
    });
  };

  const handleClientUpdateSubmit = async (e: React.FormEvent) => {
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
      contactoTelefono: editClientForm.contactoTelefono.trim() || 'No especificado',
      pais: editClientForm.pais || '',
      provincia: editClientForm.provincia || '',
      contactos: editClientForm.contactos || []
    };

    if (onUpdateClient) {
      try {
        await onUpdateClient(updatedClient);
        setAlertState({
          show: true,
          type: 'success',
          title: 'Actualización Exitosa',
          message: '¡El cliente ha sido actualizado con éxito en la base de datos!'
        });
        setSelectedClientForView(updatedClient);
        setIsEditingClient(false);
      } catch (err: any) {
        if (err.message === "offline") {
          setAlertState({
            show: true,
            type: 'error',
            title: 'Error de Conexión',
            message: 'No se pudo actualizar el cliente: sin conexión con el servidor. Los cambios NO fueron guardados. Verifique su conexión e intente de nuevo.'
          });
        } else {
          setAlertState({
            show: true,
            type: 'error',
            title: 'Error de Actualización',
            message: 'No se pudo actualizar el cliente: ' + (err.message || "Error desconocido")
          });
        }
      }
    } else {
      setSelectedClientForView(null);
      setIsEditingClient(false);
    }
  };

  const handleContratoClick = (contrato: Contrato) => {
    setSelectedContratoForView(contrato);
    setIsEditingContrato(false);
    loadEquipos(contrato.id);
    setEditContratoForm({
      id: contrato.id,
      clientId: contrato.clientId || '',
      tipo_contract: contrato.tipo_contrato,
      tipo_contrato: contrato.tipo_contrato,
      fecha_inicio: contrato.fecha_inicio,
      fecha_fin: contrato.fecha_fin,
      estado: contrato.estado,
      comercialId: contrato.comercialId || '',
      comentarios: contrato.comentarios,
      presupuesto_total_usd: contrato.presupuesto_total_usd !== undefined ? contrato.presupuesto_total_usd.toString() : '',
      saldo_disponible_usd: contrato.saldo_disponible_usd !== undefined ? contrato.saldo_disponible_usd.toString() : '',
      monto_original: contrato.monto_original !== undefined ? contrato.monto_original.toString() : '',
      moneda: contrato.moneda || 'USD',
      pdf_base64: '',
      pdf_name: ''
    });
  };

  const handleContratoUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContratoForm.clientId) return;

    const matchedClient = clients.find(c => c.id === editContratoForm.clientId);
    const matchedComercial = users.find(u => u.id === editContratoForm.comercialId);

    const updatedContrato: Contrato = {
      id: editContratoForm.id,
      clientId: editContratoForm.clientId,
      cliente: matchedClient ? matchedClient.razonSocial : 'Cliente General',
      tipo_contrato: editContratoForm.tipo_contrato || editContratoForm.tipo_contract.trim() || 'SERVICIO',
      fecha_inicio: editContratoForm.fecha_inicio,
      fecha_fin: editContratoForm.fecha_fin,
      estado: editContratoForm.estado,
      comercialId: editContratoForm.comercialId,
      comercial: matchedComercial ? matchedComercial.username : 'Asignado General',
      comentarios: editContratoForm.comentarios.trim() || '',
      presupuesto_total_usd: editContratoForm.presupuesto_total_usd ? parseFloat(editContratoForm.presupuesto_total_usd) : undefined,
      saldo_disponible_usd: editContratoForm.saldo_disponible_usd ? parseFloat(editContratoForm.saldo_disponible_usd) : undefined,
      monto_original: editContratoForm.monto_original ? parseFloat(editContratoForm.monto_original) : 0,
      moneda: editContratoForm.moneda || 'USD',
      // Pass base64 fields to allow upload handler to catch them
      ...(editContratoForm.pdf_base64 ? {
        pdf_base64: editContratoForm.pdf_base64,
        pdf_name: editContratoForm.pdf_name
      } : {})
    } as any;

    if (onUpdateContrato) {
      try {
        await onUpdateContrato(updatedContrato);
        setAlertState({
          show: true,
          type: 'success',
          title: 'Actualización Exitosa',
          message: '¡El contrato comercial ha sido actualizado con éxito!'
        });
        setSelectedContratoForView(updatedContrato);
        setIsEditingContrato(false);
      } catch (err: any) {
        if (err.message === "offline") {
          setAlertState({
            show: true,
            type: 'error',
            title: 'Error de Conexión',
            message: 'No se pudo actualizar el contrato: sin conexión con el servidor. Los cambios NO fueron guardados. Verifique su conexión e intente de nuevo.'
          });
        } else {
          setAlertState({
            show: true,
            type: 'error',
            title: 'Error de Actualización',
            message: 'No se pudo actualizar el contrato: ' + (err.message || "Error desconocido")
          });
        }
      }
    } else {
      setSelectedContratoForView(null);
      setIsEditingContrato(false);
    }
  };

  const handleContratoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contratoForm.clientId) return;

    const matchedClient = clients.find(c => c.id === contratoForm.clientId);
    const matchedComercial = users.find(u => u.id === contratoForm.comercialId);

    const finalContractId = matchedClient ? generateContractCode(matchedClient, contratos) : `contrato_${Date.now()}`;

    // Validate uniqueness
    const isDuplicate = contratos.some(co => co.id.toUpperCase() === finalContractId.toUpperCase());
    if (isDuplicate) {
      setAlertState({
        show: true,
        type: 'error',
        title: 'Código Duplicado',
        message: `El código de contrato '${finalContractId}' ya existe en el sistema.`
      });
      return;
    }

    const newContrato: Contrato = {
      id: finalContractId,
      clientId: contratoForm.clientId,
      cliente: matchedClient ? matchedClient.razonSocial : 'Cliente General',
      tipo_contrato: contratoForm.tipo_contrato || contratoForm.tipo_contract.trim() || 'SERVICIO',
      fecha_inicio: contratoForm.fecha_inicio || new Date().toISOString().split('T')[0],
      fecha_fin: contratoForm.fecha_fin || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      estado: contratoForm.estado,
      comercialId: contratoForm.comercialId,
      comercial: matchedComercial ? matchedComercial.username : 'Asignado General',
      comentarios: contratoForm.tipo_contract.trim() ? `[${contratoForm.tipo_contract.trim()}] ${contratoForm.comentarios.trim()}` : contratoForm.comentarios.trim() || '',
      monto_original: contratoForm.monto_original ? parseFloat(contratoForm.monto_original) : 0,
      moneda: contratoForm.moneda || 'USD',
      // Pass base64 fields to allow upload handler to catch them
      ...(contratoForm.pdf_base64 ? {
        pdf_base64: contratoForm.pdf_base64,
        pdf_name: contratoForm.pdf_name
      } : {})
    } as any;

    try {
      await onAddContrato(newContrato);
      setShowContratoModal(false);
      setAlertState({
        show: true,
        type: 'success',
        title: 'Registro Exitoso',
        message: '¡El contrato comercial ha sido registrado con éxito!'
      });
      setContratoForm({
        clientId: '',
        tipo_contract: '',
        tipo_contrato: '',
        fecha_inicio: '',
        fecha_fin: '',
        estado: 'VIGENTE',
        comercialId: '',
        comentarios: '',
        monto_original: '',
        moneda: 'USD',
        pdf_base64: '',
        pdf_name: ''
      });
    } catch (err: any) {
      if (err.message === "offline") {
        setAlertState({
          show: true,
          type: 'error',
          title: 'Error de Conexión',
          message: 'No se pudo registrar el contrato: sin conexión con el servidor. El contrato NO fue guardado. Verifique su conexión e intente de nuevo.'
        });
      } else {
        setShowContratoModal(false);
        setAlertState({
          show: true,
          type: 'error',
          title: 'Error de Registro',
          message: 'No se pudo registrar el contrato: ' + (err.message || "Error desconocido")
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setAlertState({
        show: true,
        type: 'error',
        title: 'Archivo no Soportado',
        message: 'Solo se admiten documentos en formato PDF.'
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (isEdit) {
        setEditContratoForm(prev => ({
          ...prev,
          pdf_base64: base64,
          pdf_name: file.name
        }));
      } else {
        setContratoForm(prev => ({
          ...prev,
          pdf_base64: base64,
          pdf_name: file.name
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdendaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setAlertState({
        show: true,
        type: 'error',
        title: 'Archivo no Soportado',
        message: 'Solo se admiten documentos en formato PDF.'
      });
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAmpliacionForm(prev => ({ ...prev, adenda_pdf_base64: base64, adenda_pdf_name: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditAmpliacion = (amp: ContratoAmpliacion) => {
    setAmpliacionForm({
      monto: amp.monto.toString(),
      fecha_inicio: amp.fecha_inicio,
      fecha_fin: amp.fecha_fin,
      comentarios: amp.comentarios || '',
      adenda_pdf_base64: '',
      adenda_pdf_name: ''
    });
    setEditingAmpliacionId(amp.id);
    const existing = (amp.equiposAdenda || [])
      .map(ea => ea.equipo)
      .filter((eq): eq is Equipo => !!eq);
    setAdendaPendingEquipos(existing);
    setShowAmpliacionModal(true);
  };

  const handleCloseAmpliacionModal = () => {
    setShowAmpliacionModal(false);
    setEditingAmpliacionId(null);
    setAmpliacionForm({ monto: '', fecha_inicio: '', fecha_fin: '', comentarios: '', adenda_pdf_base64: '', adenda_pdf_name: '' });
    setAdendaPendingEquipos([]);
  };

  const handleAmpliacionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContratoForView) return;
    setAmpliacionLoading(true);
    const isEditing = !!editingAmpliacionId;
    try {
      const payload = {
        monto: parseFloat(ampliacionForm.monto),
        fecha_inicio: ampliacionForm.fecha_inicio,
        fecha_fin: ampliacionForm.fecha_fin,
        comentarios: ampliacionForm.comentarios,
        ...(ampliacionForm.adenda_pdf_base64 ? {
          adenda_pdf_base64: ampliacionForm.adenda_pdf_base64,
          adenda_pdf_name: ampliacionForm.adenda_pdf_name
        } : {})
      };
      const url = isEditing
        ? `/api/ampliaciones/${editingAmpliacionId}`
        : `/api/contracts/${selectedContratoForView.id}/ampliaciones`;
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || (isEditing ? 'Error al actualizar ampliación.' : 'Error al registrar ampliación.'));
      }
      const updatedContrato = await response.json();
      // Server returns the full updated contract including new ampliacion
      setSelectedContratoForView(updatedContrato);
      onUpdateContrato?.(updatedContrato);

      // After adenda created, associate pending equipos (only for new adendas)
      if (!isEditing && adendaPendingEquipos.length > 0) {
        const adendaId = updatedContrato.ampliaciones?.[updatedContrato.ampliaciones.length - 1]?.id;
        if (adendaId) {
          await Promise.allSettled(
            adendaPendingEquipos.map(eq =>
              fetch(`/api/contracts/${selectedContratoForView!.id}/ampliaciones/${adendaId}/equipos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ equipoId: eq.id })
              })
            )
          );
        }
      }
      await loadEquipos(selectedContratoForView!.id);

      handleCloseAmpliacionModal();
      setAlertState({
        show: true,
        type: 'success',
        title: isEditing ? 'Ampliación Actualizada' : 'Ampliación Registrada',
        message: isEditing
          ? 'La adenda fue actualizada correctamente.'
          : '¡La adenda fue registrada y el monto total fue actualizado.'
      });
    } catch (err: any) {
      setAlertState({
        show: true,
        type: 'error',
        title: isEditing ? 'Error al Actualizar' : 'Error al Registrar',
        message: err.message || 'Error desconocido.'
      });
    } finally {
      setAmpliacionLoading(false);
    }
  };

  // Equipment handlers
  async function loadEquipos(contratoId: string) {
    setEquiposLoading(true);
    try {
      const res = await fetch(`/api/equipos?contratoId=${encodeURIComponent(contratoId)}`);
      const data = await res.json();
      setContratoEquipos(data || []);
    } catch (err) {
      console.error('Error loading equipos:', err);
    } finally {
      setEquiposLoading(false);
    }
  }

  async function handleAsignarEquipo(equipoId: string) {
    if (!selectedContratoForView) return;
    const res = await fetch(`/api/contracts/${selectedContratoForView.id}/equipos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipoId })
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || 'Error al asignar equipo');
    }
    await loadEquipos(selectedContratoForView.id);

    setAlertState({
      show: true,
      type: 'success',
      title: 'Equipo Asignado',
      message: 'El equipo ha sido asignado al contrato correctamente.'
    });
  }

  async function handleCrearEquipo(data: Partial<Equipo>): Promise<Equipo> {
    const res = await fetch('/api/equipos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || 'Error al crear equipo');
    }
    return res.json();
  }

  async function handleLiberarEquipo(equipoId: string) {
    if (!selectedContratoForView) return;
    const res = await fetch(`/api/contracts/${selectedContratoForView.id}/equipos/${equipoId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al liberar equipo');
    await loadEquipos(selectedContratoForView.id);
    setSelectedEquipoId(null);
  }

  async function handleUpdateEquipo(equipoId: string, data: Partial<Equipo>) {
    const res = await fetch(`/api/equipos/${equipoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al actualizar equipo');

  }

  // Handler: open PDF report for a specific OT from equipment history
  async function handleVerReporte(otId: string) {
    if (isGeneratingReportePdf) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setAlertState({ show: true, type: 'error', title: 'Pop-up Bloqueado', message: 'El navegador bloqueó la ventana emergente. Habilite los pop-ups para esta página.' });
      return;
    }
    try {
      const [otRes, reportRes] = await Promise.all([
        fetch(`/api/ots`),
        fetch(`/api/reports`)
      ]);
      const allOts: OT[] = await otRes.json();
      const allReports: TechnicalReport[] = await reportRes.json();
      const ot = allOts.find(o => o.id === otId);
      const report = allReports.find(r => r.otId === otId);
      if (!ot) {
        printWindow.close();
        setAlertState({ show: true, type: 'error', title: 'OT no Encontrada', message: 'No se encontró la Orden de Trabajo.' });
        return;
      }
      if (!report) {
        printWindow.close();
        setAlertState({ show: true, type: 'error', title: 'Informe no Disponible', message: 'Esta OT aún no tiene informe técnico redactado.' });
        return;
      }
      const client = clients.find(c => c.id === ot.clientId) || null;
      setIsGeneratingReportePdf(true);
      setPdfReporteOt(ot);
      setPdfReporteReport(report);
      setPdfReporteClient(client);
      setTimeout(() => {
        try {
          const element = document.getElementById('equipo-reporte-pdf-element');
          if (!element) throw new Error('Contenedor PDF no encontrado');
          const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(el => el.outerHTML).join('\n');
          printWindow.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe ${otId}</title>${styles}<style>@media print{body{background:#fff!important;padding:0;margin:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}.no-print{display:none!important;}@page{size:A4 portrait;margin:12mm 10mm;}}</style></head><body>${element.innerHTML}</body></html>`);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => { printWindow.print(); }, 800);
        } catch (e) {
          printWindow.close();
        } finally {
          setIsGeneratingReportePdf(false);
          setPdfReporteOt(null);
          setPdfReporteReport(null);
          setPdfReporteClient(null);
        }
      }, 500);
    } catch (err) {
      printWindow.close();
      setIsGeneratingReportePdf(false);
    }
  }

  async function handleAddEquipoToAdenda(equipoId: string) {
    if (!selectedContratoForView) return;
    
    // Step 1: Assign to contract first
    const res = await fetch(`/api/contracts/${selectedContratoForView.id}/equipos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipoId })
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || 'Error al asignar equipo a la adenda');
    }
    const equipo = await res.json();

    // Step 2: If in edit mode, assign to adenda immediately in DB
    if (editingAmpliacionId) {
      const adendaRes = await fetch(`/api/contracts/${selectedContratoForView.id}/ampliaciones/${editingAmpliacionId}/equipos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipoId })
      });
      if (!adendaRes.ok) {
        const errBody = await adendaRes.json().catch(() => ({}));
        throw new Error(errBody.error || 'Error al asociar equipo a la adenda');
      }
    }

    setAdendaPendingEquipos(prev => [...prev, equipo]);

    // Show success alert
    setAlertState({
      show: true,
      type: 'success',
      title: 'Equipo Agregado',
      message: 'El equipo ha sido asignado a la adenda exitosamente.'
    });
  }

  async function handleRemoveEquipoFromAdenda(equipoId: string) {
    if (editingAmpliacionId && selectedContratoForView) {
      try {
        const res = await fetch(`/api/contracts/${selectedContratoForView.id}/ampliaciones/${editingAmpliacionId}/equipos/${equipoId}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Error al retirar equipo de la adenda');
      } catch (err: any) {
        setAlertState({
          show: true,
          type: 'error',
          title: 'Error al Retirar',
          message: err.message || 'No se pudo retirar el equipo de la adenda.'
        });
        return;
      }
    }
    setAdendaPendingEquipos(prev => prev.filter(e => e.id !== equipoId));
  }

  const renderAdditionalContactsForm = (
    formState: any,
    setFormState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const addContact = () => {
      const current = formState.contactos || [];
      setFormState({
        ...formState,
        contactos: [...current, { nombre: '', email: '', telefono: '' }]
      });
    };

    const removeContact = (index: number) => {
      const current = formState.contactos || [];
      const updated = current.filter((_, i) => i !== index);
      setFormState({
        ...formState,
        contactos: updated
      });
    };

    const updateContact = (index: number, field: string, value: string) => {
      const current = formState.contactos || [];
      const updated = current.map((c, i) => i === index ? { ...c, [field]: value } : c);
      setFormState({
        ...formState,
        contactos: updated
      });
    };

    const contacts = formState.contactos || [];

    return (
      <div className="border-t border-slate-100 pt-3 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-[#00B594] font-mono">Contactos Adicionales</h4>
          <button
            type="button"
            onClick={addContact}
            className="text-[9px] font-black uppercase text-[#00B594] hover:text-[#009b7e] cursor-pointer flex items-center gap-1 font-mono bg-transparent border-none outline-none"
          >
            + Agregar
          </button>
        </div>

        {contacts.length === 0 ? (
          <p className="text-[10px] text-slate-400 font-medium italic">No hay contactos adicionales definidos.</p>
        ) : (
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {contacts.map((contact: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                <button
                  type="button"
                  onClick={() => removeContact(idx)}
                  className="absolute top-2 right-2 text-slate-400 hover:text-red-500 cursor-pointer bg-transparent border-none outline-none flex items-center justify-center p-1"
                >
                  <Trash2 size={12} />
                </button>
                <div>
                  <label className="text-[8px] font-extrabold uppercase text-slate-400 block mb-0.5 font-mono">Nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={contact.nombre}
                    onChange={(e) => updateContact(idx, 'nombre', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-extrabold uppercase text-slate-400 block mb-0.5 font-mono">Email</label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={contact.email}
                      onChange={(e) => updateContact(idx, 'email', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-extrabold uppercase text-slate-400 block mb-0.5 font-mono">Teléfono</label>
                    <input
                      type="text"
                      placeholder="Teléfono"
                      value={contact.telefono}
                      onChange={(e) => updateContact(idx, 'telefono', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const generateClientCode = (name: string, existingClients: Client[]): string => {
    if (!name) return "";
    const cleanName = name.trim().toUpperCase().replace(/[^A-Z0-9\s-]/g, '');
    const words = cleanName.split(/[\s-]+/).filter(w => w.length > 0);

    let prefix = "";
    if (words.length >= 2) {
      prefix = words[0][0] + words[1][0];
    } else if (words.length === 1) {
      const word = words[0];
      const prefixes = ["INTER", "TELE", "MICRO", "MEGA", "SUPER", "MINI", "MULTI", "COOP", "TRANS", "AUTO", "MUNI", "CORP"];
      let foundPrefix = false;
      for (const p of prefixes) {
        if (word.startsWith(p) && word.length > p.length) {
          prefix = p[0] + word[p.length];
          foundPrefix = true;
          break;
        }
      }
      if (!foundPrefix) {
        if (word.length >= 2) {
          prefix = word.substring(0, 2);
        } else {
          prefix = word + "X";
        }
      }
    } else {
      prefix = "CL";
    }

    const suffix = "-CL-";
    let maxSeq = 0;
    for (const c of existingClients) {
      if (c.id && c.id.startsWith(prefix + suffix)) {
        const parts = c.id.split(suffix);
        const numPart = parseInt(parts[1], 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${suffix}${nextSeq}`;
  };

  const generateContractCode = (client: Client, existingContratos: Contrato[]): string => {
    if (!client) return "";
    let prefix = "";
    const match = client.id.match(/^([A-Z0-9]+)-CL-\d+$/i);
    if (match) {
      prefix = match[1].toUpperCase();
    } else {
      const cleanName = client.razonSocial.trim().toUpperCase().replace(/[^A-Z0-9\s-]/g, '');
      const words = cleanName.split(/[\s-]+/).filter(w => w.length > 0);
      if (words.length >= 2) {
        prefix = words[0][0] + words[1][0];
      } else if (words.length === 1 && words[0].length >= 2) {
        prefix = words[0].substring(0, 2);
      } else {
        prefix = "CO";
      }
    }

    const suffix = "-CO-";
    let maxSeq = 0;
    for (const co of existingContratos) {
      if (co.id && co.id.startsWith(prefix + suffix)) {
        const parts = co.id.split(suffix);
        const numPart = parseInt(parts[1], 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${suffix}${nextSeq}`;
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
              data-tour="cliente-crear"
              className="bg-[#00B594] hover:bg-[#00a385] text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-[0_4px_12px_rgba(0,181,148,0.2)] flex items-center gap-2 cursor-pointer transition-all"
            >
              <UserPlus size={15} />
              Registrar Cliente
            </button>
          ) : (
            <button
              onClick={() => setShowContratoModal(true)}
              data-tour="contrato-crear"
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
                      <div className="text-[9px] text-[#00B594] font-mono font-bold mt-0.5">{client.id}</div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-450 font-bold mt-1">
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
                        <div className="text-[10px] text-[#00B594] font-mono font-bold mt-0.5">{client.id}</div>
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
                const presupuesto = contrato.monto_sin_igv || contrato.presupuesto_total_usd || contrato.monto_original || 0;
                const facturado = contrato.monto_facturado_sin_igv || 0;
                const saldo = contrato.saldo_disponible_usd !== undefined && contrato.saldo_disponible_usd !== null 
                  ? contrato.saldo_disponible_usd 
                  : Math.max(0, presupuesto - facturado);
                const consumo = facturado > 0 ? facturado : Math.max(0, presupuesto - saldo);
                const pct = presupuesto > 0 ? (consumo / presupuesto) * 100 : 0;
                const currSymbol = contrato.moneda === 'USD' ? '$' : 'S/';
                
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
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-800 line-clamp-1 group-hover:text-[#00B594] transition-colors">
                          {contrato.cliente}
                        </h3>
                        <div className="text-[9px] text-[#00B594] font-mono font-bold mt-0.5">{contrato.n_contrato || contrato.id}</div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold truncate max-w-xs">{contrato.tipo_contrato}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400 font-semibold">Vigencia:</span>
                          <span className="text-slate-700 font-bold font-mono text-[9px]">{contrato.fecha_inicio} al {contrato.fecha_fin}</span>
                        </div>
                        {contrato.fecha_fin_original && contrato.fecha_fin_original !== contrato.fecha_fin && (
                          <div className="flex justify-between text-[9px]">
                            <span className="text-slate-300 font-semibold">Original:</span>
                            <span className="text-slate-400 font-mono">{contrato.fecha_fin_original}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400 font-semibold">Responsable:</span>
                          <span className="text-slate-700 font-bold">{contrato.comercial}</span>
                        </div>
                      </div>

                      {presupuesto > 0 ? (
                        <div className="pt-3 border-t border-slate-100 space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-450">Consumo ({pct.toFixed(0)}%):</span>
                            <span className="text-slate-700">{currSymbol}{consumo.toFixed(0)} / {currSymbol}{presupuesto.toFixed(0)}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${progressColor} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400">
                            <span>Saldo disponible:</span>
                            <span className="font-mono font-bold text-slate-605">{currSymbol}{saldo.toFixed(2)}</span>
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
                        <div className="text-[10px] text-[#00B594] font-mono font-bold mt-0.5">{contrato.id}</div>
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
                          {contrato.fecha_fin_original && contrato.fecha_fin_original !== contrato.fecha_fin && (
                            <span className="text-[9px] text-slate-400">Original: {contrato.fecha_fin_original}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-bold text-slate-600">{contrato.comercial}</div>
                      </td>
                      <td className="px-5 py-4">
                        {(() => {
                          const presupuesto = contrato.monto_sin_igv || contrato.presupuesto_total_usd || contrato.monto_original || 0;
                          if (!presupuesto) return <span className="text-[10px] font-medium text-slate-400 italic">No definido</span>;
                          const facturado = contrato.monto_facturado_sin_igv || 0;
                          const saldo = contrato.saldo_disponible_usd !== undefined && contrato.saldo_disponible_usd !== null 
                            ? contrato.saldo_disponible_usd 
                            : Math.max(0, presupuesto - facturado);
                          const consumo = facturado > 0 ? facturado : Math.max(0, presupuesto - saldo);
                          const pct = (consumo / presupuesto) * 100;
                          const currSymbol = contrato.moneda === 'USD' ? '$' : 'S/';
                          
                          let badgeClass = "bg-[#E6F7F4] text-[#00B594] border-[#00B594]/20";
                          if (pct >= 95) badgeClass = "bg-rose-100 text-rose-600 border-rose-200";
                          else if (pct >= 80) badgeClass = "bg-amber-100 text-amber-600 border-amber-200";
                          
                          return (
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`text-[9px] font-extrabold font-mono px-2 py-0.5 rounded border ${badgeClass}`}>
                                {pct.toFixed(0)}% CONSUMIDO
                              </span>
                              <span className="text-[10px] font-bold text-slate-600">
                                Saldo: {currSymbol}{saldo.toFixed(2)}
                              </span>
                            </div>
                          );
                        })()}
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
      {showClientModal && createPortal(
        <>
          <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-[85] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 my-8">
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
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Código de Cliente</label>
                <input
                  type="text"
                  disabled
                  placeholder="Se generará al escribir la Razón Social"
                  value={clientForm.id}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-500 font-mono focus:outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Razón Social Legal <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Repsol Data Center Perú S.A."
                  value={clientForm.razonSocial}
                  onChange={(e) => {
                    const name = e.target.value;
                    const code = generateClientCode(name, clients);
                    setClientForm({ ...clientForm, razonSocial: name, id: code });
                  }}
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
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">País</label>
                  <select
                    value={clientForm.pais}
                    onChange={(e) => setClientForm({ ...clientForm, pais: e.target.value, provincia: '', distrito: '' })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="">Seleccione país</option>
                    {paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Provincia</label>
                  <select
                    value={clientForm.provincia}
                    onChange={(e) => setClientForm({ ...clientForm, provincia: e.target.value, distrito: '' })}
                    disabled={!clientForm.pais}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 disabled:bg-slate-50 focus:outline-none"
                  >
                    <option value="">Seleccione provincia</option>
                    {provincias.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Distrito</label>
                  <select
                    value={clientForm.distrito}
                    onChange={(e) => setClientForm({ ...clientForm, distrito: e.target.value })}
                    disabled={!clientForm.provincia}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 disabled:bg-slate-50 focus:outline-none"
                  >
                    <option value="">Seleccione distrito</option>
                    {distritos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </div>
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
              {renderAdditionalContactsForm(clientForm, setClientForm)}

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
      </>,
      document.body
    )}

    {/* MODAL CONTRATO */}
      {showContratoModal && createPortal(
        <>
          <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-[85] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 my-8">
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
              {(() => {
                const selectedClientForContract = clients.find(c => c.id === contratoForm.clientId);
                const generatedContractCode = selectedClientForContract ? generateContractCode(selectedClientForContract, contratos) : '';
                return (
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Código de Contrato</label>
                    <input
                      type="text"
                      disabled
                      placeholder="Se generará al seleccionar un cliente"
                      value={generatedContractCode}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-500 font-mono focus:outline-none cursor-not-allowed"
                    />
                  </div>
                );
              })()}
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Tipo de Contrato <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={contratoForm.tipo_contrato}
                  onChange={(e) => setContratoForm({ ...contratoForm, tipo_contrato: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                >
                  <option value="">Seleccione tipo...</option>
                  {tipoContratos.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
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
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Monto del Contrato <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    placeholder="Ej: 5000.00"
                    value={contratoForm.monto_original}
                    onChange={(e) => setContratoForm({ ...contratoForm, monto_original: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Moneda</label>
                  <select
                    value={contratoForm.moneda}
                    onChange={(e) => setContratoForm({ ...contratoForm, moneda: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="PEN">Soles (S/.)</option>
                    <option value="USD">Dólares ($)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Contrato Digitalizado (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, false)}
                  className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#E6F7F4] file:text-[#00B594] hover:file:bg-[#d0f2eb]"
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
      </>,
      document.body
    )}

      {/* MODAL DETALLE / EDICIÓN CLIENTE */}
      {selectedClientForView && createPortal(
        <>
          <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 overflow-y-auto">
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
                    <span className="text-[9px] font-extrabold uppercase font-mono bg-emerald-50 text-[#00B594] px-2 py-0.5 rounded-full inline-block mt-1 ml-1.5 border border-[#00B594]/20">
                      Código: {selectedClientForView.id}
                    </span>
                  </div>
                  <div className="p-3 bg-[#E6F7F4] rounded-2xl border border-[#00B594]/10">
                    <Building2 size={24} className="text-[#00B594]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Código Cliente</span>
                    <span className="text-xs text-[#00B594] font-mono font-bold block">{selectedClientForView.id}</span>
                  </div>
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

                {selectedClientForView.contactos && selectedClientForView.contactos.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-[#00B594] font-mono">Contactos Adicionales</h5>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {selectedClientForView.contactos.map((c, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-150 rounded-2xl grid grid-cols-2 gap-2 text-xs">
                          <div className="col-span-full">
                            <span className="text-[8px] font-extrabold uppercase text-slate-400 block font-mono">Nombre</span>
                            <span className="font-bold text-slate-800">{c.nombre || 'Sin nombre'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-extrabold uppercase text-slate-400 block font-mono">Email</span>
                            <span className="font-semibold text-slate-600 font-mono break-all">{c.email || 'Sin email'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-extrabold uppercase text-slate-400 block font-mono">Teléfono</span>
                            <span className="font-bold text-slate-800 font-mono">{c.telefono || 'Sin teléfono'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                              <div className="font-black text-slate-800">Contrato: {contract.id}</div>
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
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Código de Cliente</label>
                  <input
                    type="text"
                    disabled
                    value={editClientForm.id}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-500 font-mono focus:outline-none cursor-not-allowed"
                  />
                </div>
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
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">País</label>
                    <select
                      value={editClientForm.pais}
                      onChange={(e) => setEditClientForm({ ...editClientForm, pais: e.target.value, provincia: '', distrito: '' })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="">Seleccione país</option>
                      {paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Provincia</label>
                    <select
                      value={editClientForm.provincia}
                      onChange={(e) => setEditClientForm({ ...editClientForm, provincia: e.target.value, distrito: '' })}
                      disabled={!editClientForm.pais}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 disabled:bg-slate-50 focus:outline-none"
                    >
                      <option value="">Seleccione provincia</option>
                      {provincias.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Distrito</label>
                    <select
                      value={editClientForm.distrito}
                      onChange={(e) => setEditClientForm({ ...editClientForm, distrito: e.target.value })}
                      disabled={!editClientForm.provincia}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 disabled:bg-slate-50 focus:outline-none"
                    >
                      <option value="">Seleccione distrito</option>
                      {distritos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                    </select>
                  </div>
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
                {renderAdditionalContactsForm(editClientForm, setEditClientForm)}

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
        </>,
        document.body
      )}

      {/* MODAL DETALLE / EDICIÓN CONTRATO */}
      {selectedContratoForView && createPortal(
        <>
          <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-[85] flex items-start justify-center p-4 overflow-y-auto pt-8">
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
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-extrabold uppercase font-mono bg-emerald-50 text-[#00B594] px-2 py-0.5 rounded-full inline-block border border-[#00B594]/20">
                        Código: {selectedContratoForView.id}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 mt-1">{selectedContratoForView.cliente}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold inline-block mt-0.5">{selectedContratoForView.tipo_contrato}</span>
                  </div>
                  <div className="p-3 bg-[#E6F7F4] rounded-2xl border border-[#00B594]/10 shrink-0">
                    <Briefcase size={24} className="text-[#00B594]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Código Contrato</span>
                    <span className="text-xs text-[#00B594] font-mono font-bold block">{selectedContratoForView.id}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Fecha de Inicio</span>
                    <span className="text-xs text-slate-700 font-bold block font-mono">{selectedContratoForView.fecha_inicio}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">Fecha de Fin</span>
                    <span className="text-xs text-slate-700 font-bold block font-mono">{selectedContratoForView.fecha_fin}</span>
                    {selectedContratoForView.fecha_fin_original && selectedContratoForView.fecha_fin_original !== selectedContratoForView.fecha_fin && (
                      <span className="text-[9px] text-slate-400 font-mono block">
                        Original: {selectedContratoForView.fecha_fin_original}
                      </span>
                    )}
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

                {/* Equipos Asociados */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-[#00B594] font-mono">
                      Equipos Asociados
                      {contratoEquipos.length > 0 && (
                        <span className="ml-2 bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full text-[9px] font-black font-mono">
                          {contratoEquipos.length}
                        </span>
                      )}
                    </h5>
                  </div>
                  {equiposLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#00B594] border-t-transparent"></div>
                    </div>
                  ) : contratoEquipos.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic font-mono">Sin equipos asociados a este contrato.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {contratoEquipos.map(eq => {
                        const estadoColors: Record<string, string> = {
                          'Operativo': 'bg-emerald-100 text-emerald-700',
                          'En almacén': 'bg-blue-100 text-blue-700',
                          'En reparación': 'bg-amber-100 text-amber-700',
                          'En observación': 'bg-orange-100 text-orange-700',
                          'Baja': 'bg-red-100 text-red-700',
                        };
                        return (
                          <div
                            key={eq.id}
                            onClick={() => setSelectedEquipoId(eq.id)}
                            className="bg-teal-50 border border-teal-100 rounded-xl p-3 space-y-1.5 hover:bg-teal-100/50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-extrabold font-mono text-teal-700">{eq.codigo}</span>
                                <span className={`text-[8px] font-extrabold uppercase font-mono px-1.5 py-0.5 rounded-full ${estadoColors[eq.estado] || 'bg-slate-100 text-slate-600'}`}>
                                  {eq.estado}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400"><polyline points="9 18 15 12 9 6"/></svg>
                              </div>
                            </div>
                            <p className="text-[9px] text-slate-500">{eq.tipo}{eq.marca ? ` • ${eq.marca}` : ''}{eq.modelo ? ` • ${eq.modelo}` : ''}{eq.potenciaKva ? ` • ${eq.potenciaKva} KVA` : ''}</p>
                            {eq.servicios && eq.servicios.length > 0 && (
                              <p className="text-[8px] text-teal-500 font-mono">
                                Último servicio: {new Date(eq.servicios[0].fecha).toLocaleDateString('es-PE')}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Monto del Contrato */}
                {(selectedContratoForView.monto_original !== undefined && selectedContratoForView.monto_original !== null) && (() => {
                  const moneda = selectedContratoForView.moneda || 'USD';
                  const symbol = moneda === 'PEN' ? 'S/.' : '$';
                  const sumaAdendas = (selectedContratoForView.ampliaciones || []).reduce((acc, a) => acc + a.monto, 0);
                  const montoTotal = (selectedContratoForView.monto_original || 0) + sumaAdendas;
                  return (
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-[#00B594] font-mono">Monto Contractual</h5>
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100 grid grid-cols-3 gap-3 text-center">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-mono">Monto Original</span>
                          <span className="font-mono font-bold text-slate-700 text-xs">{symbol} {(selectedContratoForView.monto_original || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-mono">Adendas</span>
                          <span className="font-mono font-bold text-amber-600 text-xs">{symbol} {sumaAdendas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-mono">Total Vigente</span>
                          <span className="font-mono font-black text-[#00B594] text-sm">{symbol} {montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* PDF del Contrato */}
                {selectedContratoForView.pdf_url && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-[#00B594] font-mono">Documento del Contrato</h5>
                    <a
                      href={getContractPdfUrl(selectedContratoForView.pdf_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#E6F7F4] hover:bg-[#d0f2eb] text-[#00B594] font-bold rounded-xl text-xs transition-colors border border-[#00B594]/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Ver Contrato Digitalizado (PDF)
                    </a>
                  </div>
                )}

                {/* Historial de Ampliaciones */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-[#00B594] font-mono">
                      Ampliaciones / Adendas
                      {(selectedContratoForView.ampliaciones || []).length > 0 && (
                        <span className="ml-2 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[9px] font-black font-mono">
                          {selectedContratoForView.ampliaciones!.length}
                        </span>
                      )}
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowAmpliacionModal(true)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-[10px] cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Registrar Ampliación
                    </button>
                  </div>
                  {(selectedContratoForView.ampliaciones || []).length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic font-mono">Sin ampliaciones registradas.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedContratoForView.ampliaciones!.map((amp, idx) => {
                        const moneda = selectedContratoForView.moneda || 'USD';
                        const symbol = moneda === 'PEN' ? 'S/.' : '$';
                        return (
                          <div key={amp.id} className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-extrabold font-mono text-amber-700 uppercase">{amp.codigo || `Adenda #${idx + 1}`}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditAmpliacion(amp)}
                                  className="text-amber-500 hover:text-amber-700 cursor-pointer"
                                  title="Editar adenda"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                </button>
                                <span className="font-mono font-black text-amber-700 text-xs">{symbol} {amp.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[9px] text-slate-400 block font-mono uppercase">Inicio Adenda</span>
                                <span className="text-[10px] text-slate-700 font-bold font-mono">{amp.fecha_inicio}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 block font-mono uppercase">Fin Adenda</span>
                                <span className="text-[10px] text-slate-700 font-bold font-mono">{amp.fecha_fin}</span>
                              </div>
                            </div>
                            {amp.comentarios && (
                              <p className="text-[10px] text-slate-500 italic">{amp.comentarios}</p>
                            )}
                            {amp.adenda_pdf_url && (
                              <a
                                href={getContractPdfUrl(amp.adenda_pdf_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-amber-700 hover:text-amber-900 font-bold underline underline-offset-2"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                Ver Adenda PDF
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                    onClick={() => {
                      if (selectedContratoForView) {
                        setEditContratoForm({
                          id: selectedContratoForView.id,
                          clientId: selectedContratoForView.clientId || '',
                          tipo_contract: selectedContratoForView.tipo_contrato,
                          tipo_contrato: selectedContratoForView.tipo_contrato,
                          fecha_inicio: selectedContratoForView.fecha_inicio,
                          fecha_fin: selectedContratoForView.fecha_fin,
                          estado: selectedContratoForView.estado,
                          comercialId: selectedContratoForView.comercialId || '',
                          comentarios: selectedContratoForView.comentarios || '',
                          presupuesto_total_usd: selectedContratoForView.presupuesto_total_usd !== undefined && selectedContratoForView.presupuesto_total_usd !== null ? selectedContratoForView.presupuesto_total_usd.toString() : '',
                          saldo_disponible_usd: selectedContratoForView.saldo_disponible_usd !== undefined && selectedContratoForView.saldo_disponible_usd !== null ? selectedContratoForView.saldo_disponible_usd.toString() : '',
                          monto_original: selectedContratoForView.monto_original !== undefined && selectedContratoForView.monto_original !== null ? selectedContratoForView.monto_original.toString() : '',
                          moneda: selectedContratoForView.moneda || 'USD',
                          pdf_base64: '',
                          pdf_name: ''
                        });
                      }
                      setIsEditingContrato(true);
                    }}
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
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Tipo de Contrato <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={editContratoForm.tipo_contrato}
                    onChange={(e) => setEditContratoForm({ ...editContratoForm, tipo_contrato: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="">Seleccione tipo...</option>
                    {tipoContratos.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
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
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Monto del Contrato <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      placeholder="Ej: 5000.00"
                      value={editContratoForm.monto_original}
                      onChange={(e) => setEditContratoForm({ ...editContratoForm, monto_original: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Moneda</label>
                    <select
                      value={editContratoForm.moneda}
                      onChange={(e) => setEditContratoForm({ ...editContratoForm, moneda: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="PEN">Soles (S/.)</option>
                      <option value="USD">Dólares ($)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Actualizar Contrato Digitalizado (PDF)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, true)}
                    className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#E6F7F4] file:text-[#00B594] hover:file:bg-[#d0f2eb]"
                  />
                  {editContratoForm.pdf_name && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">Listo para subir: {editContratoForm.pdf_name}</p>
                  )}
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

                {/* Equipos Asociados (Modo Edición) */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-[#00B594] font-mono">
                      Equipos Asociados (Edición)
                      {contratoEquipos.length > 0 && (
                        <span className="ml-2 bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full text-[9px] font-black font-mono">
                          {contratoEquipos.length}
                        </span>
                      )}
                    </h5>
                    <button
                      type="button"
                      onClick={() => { setPickerMode('contrato'); setShowEquipoPicker(true); }}
                      data-tour="contrato-equipo"
                      className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-xl text-[10px] cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Asignar Equipo
                    </button>
                  </div>
                  {equiposLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#00B594] border-t-transparent"></div>
                    </div>
                  ) : contratoEquipos.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic font-mono">Sin equipos asociados a este contrato.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {contratoEquipos.map(eq => {
                        const estadoColors: Record<string, string> = {
                          'Operativo': 'bg-emerald-100 text-emerald-700',
                          'En almacén': 'bg-blue-100 text-blue-700',
                          'En reparación': 'bg-amber-100 text-amber-700',
                          'En observación': 'bg-orange-100 text-orange-700',
                          'Baja': 'bg-red-100 text-red-700',
                        };
                        return (
                          <div
                            key={eq.id}
                            onClick={() => setSelectedEquipoId(eq.id)}
                            className="bg-teal-50 border border-teal-100 rounded-xl p-3 space-y-1.5 hover:bg-teal-100/50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-extrabold font-mono text-teal-700">{eq.codigo}</span>
                                <span className={`text-[8px] font-extrabold uppercase font-mono px-1.5 py-0.5 rounded-full ${estadoColors[eq.estado] || 'bg-slate-100 text-slate-600'}`}>
                                  {eq.estado}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmState({
                                      show: true,
                                      title: 'Retirar Equipo',
                                      message: `¿Seguro que desea retirar el equipo ${eq.codigo} del contrato?`,
                                      onConfirm: () => handleLiberarEquipo(eq.id)
                                    });
                                  }}
                                  className="p-1 hover:bg-rose-100 rounded text-rose-500 hover:text-rose-700 cursor-pointer transition-colors"
                                  title="Retirar equipo del contrato"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400"><polyline points="9 18 15 12 9 6"/></svg>
                              </div>
                            </div>
                            <p className="text-[9px] text-slate-500">{eq.tipo}{eq.marca ? ` • ${eq.marca}` : ''}{eq.modelo ? ` • ${eq.modelo}` : ''}{eq.potenciaKva ? ` • ${eq.potenciaKva} KVA` : ''}</p>
                            {eq.servicios && eq.servicios.length > 0 && (
                              <p className="text-[8px] text-teal-500 font-mono">
                                Último servicio: {new Date(eq.servicios[0].fecha).toLocaleDateString('es-PE')}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
        </>,
        document.body
      )}

      {/* GESTIA CUSTOM NOTIFICATION ALERT MODAL */}
      {createPortal(
        alertState.show ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in text-slate-800 font-sans" id="gestia-notification-modal">
            <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 text-left">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  alertState.type === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-500' :
                  alertState.type === 'error' ? 'bg-rose-50 border border-rose-100 text-rose-500' :
                  'bg-sky-50 border border-sky-100 text-sky-500'
                }`}>
                  {alertState.type === 'success' ? <CheckCircle2 size={18} /> :
                   alertState.type === 'error' ? <XCircle size={18} /> :
                   <Cloud size={18} />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-850 text-sm">{alertState.title}</h4>
                  <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wide">GESTIA HUB & CONTROL DE CALIDAD</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {alertState.message}
              </p>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setAlertState(prev => ({ ...prev, show: false }))}
                  className={`px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    alertState.type === 'success' ? 'bg-[#00B594] hover:bg-[#009b7e] text-white shadow-sm' :
                    alertState.type === 'error' ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm' :
                    'bg-slate-800 hover:bg-slate-900 text-white shadow-sm'
                  }`}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        ) : null,
        document.body
      )}

      {/* GESTIA CUSTOM CONFIRMATION MODAL */}
      {createPortal(
        confirmState.show ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in text-slate-800 font-sans" id="gestia-confirmation-modal">
            <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 text-left">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-rose-50 border border-rose-100 text-rose-500">
                  <XCircle size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-850 text-sm">{confirmState.title}</h4>
                  <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wide">GESTIA HUB & CONTROL DE CALIDAD</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {confirmState.message}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmState(prev => ({ ...prev, show: false }))}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmState(prev => ({ ...prev, show: false }));
                    confirmState.onConfirm?.();
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-sm cursor-pointer transition-all"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        ) : null,
        document.body
      )}

      {/* MODAL AMPLIACIÓN */}
      {showAmpliacionModal && selectedContratoForView && createPortal(
        <>
          <div className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-sm" />
          <div className="fixed inset-0 z-[85] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 my-8">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                {editingAmpliacionId ? 'Editar Ampliación — Adenda' : 'Registrar Ampliación — Adenda'}
              </h3>
              <button onClick={handleCloseAmpliacionModal} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleAmpliacionSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                <span className="text-[9px] font-extrabold uppercase font-mono text-amber-600">Contrato</span>
                <p className="text-xs font-bold text-slate-800">{selectedContratoForView.id} — {selectedContratoForView.cliente}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Monto Adenda <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={ampliacionForm.monto}
                    onChange={(e) => setAmpliacionForm(p => ({ ...p, monto: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Moneda</label>
                  <input
                    type="text"
                    disabled
                    value={selectedContratoForView.moneda === 'PEN' ? 'Soles (S/.)' : 'Dólares ($)'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Fecha Inicio <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={ampliacionForm.fecha_inicio}
                    onChange={(e) => setAmpliacionForm(p => ({ ...p, fecha_inicio: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Fecha Fin <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={ampliacionForm.fecha_fin}
                    onChange={(e) => setAmpliacionForm(p => ({ ...p, fecha_fin: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Comentarios / Justificación</label>
                <textarea
                  rows={3}
                  placeholder="Ej: Ampliación por servicios adicionales solicitados por el cliente..."
                  value={ampliacionForm.comentarios}
                  onChange={(e) => setAmpliacionForm(p => ({ ...p, comentarios: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1 font-mono">Adenda Digitalizada (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleAdendaFileChange}
                  className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-600 hover:file:bg-amber-100"
                />
                {ampliacionForm.adenda_pdf_name && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-1">Listo: {ampliacionForm.adenda_pdf_name}</p>
                )}
              </div>

              {/* Equipos incorporados por esta adenda */}
              <div className="pt-2 border-t border-amber-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold uppercase text-amber-600 font-mono">Equipos incorporados</span>
                  <button
                    type="button"
                    onClick={() => { setPickerMode('adenda'); setShowEquipoPicker(true); }}
                    className="px-2.5 py-1.5 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-lg text-[9px] cursor-pointer flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Agregar Equipo
                  </button>
                </div>
                {adendaPendingEquipos.length === 0 ? (
                  <p className="text-[9px] text-slate-400 italic font-mono">Ningún equipo asignado a esta adenda aún.</p>
                ) : (
                  <div className="space-y-1">
                    {adendaPendingEquipos.map(eq => (
                      <div key={eq.id} className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[9px] font-bold text-teal-700 font-mono truncate">{eq.codigo || '—'}</span>
                          <span className="text-[8px] text-slate-500 truncate">{eq.tipo}{eq.marca ? ` • ${eq.marca}` : ''}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmState({
                              show: true,
                              title: 'Retirar de Adenda',
                              message: `¿Seguro que desea retirar el equipo ${eq.codigo || ''} de esta adenda?`,
                              onConfirm: () => handleRemoveEquipoFromAdenda(eq.id)
                            });
                          }}
                          className="text-rose-400 hover:text-rose-600 shrink-0 ml-2"
                          title="Quitar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseAmpliacionModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={ampliacionLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-black rounded-xl text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  {ampliacionLoading ? 'Guardando...' : editingAmpliacionId ? 'Actualizar Adenda' : 'Registrar Adenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </>,
      document.body
    )}

      {/* MODAL EQUIPO PICKER */}
      {showEquipoPicker && selectedContratoForView && (
        <EquipoPickerModal
          contratoId={selectedContratoForView.id}
          mode={pickerMode}
          existingIds={contratoEquipos.map(e => e.id)}
          onClose={() => setShowEquipoPicker(false)}
          onAssign={pickerMode === 'adenda' ? handleAddEquipoToAdenda : handleAsignarEquipo}
          onCreate={handleCrearEquipo}
        />
      )}

      {/* EQUIPO DETAIL DRAWER */}
      <EquipoDetailDrawer
        equipoId={selectedEquipoId}
        contratoId={selectedContratoForView?.id || ''}
        onClose={() => setSelectedEquipoId(null)}
        onUnassign={handleLiberarEquipo}
        onUpdate={handleUpdateEquipo}
        onViewReporte={handleVerReporte}
      />

      {/* Hidden container for PDF report generation from equipment history */}
      {pdfReporteOt && pdfReporteReport && (
        <div
          id="equipo-reporte-pdf-element"
          style={{ position: 'fixed', left: '-9999px', top: 0, width: '820px', zIndex: -1, background: 'white', pointerEvents: 'none' }}
        >
          <DocumentFormat
            report={pdfReporteReport}
            ot={pdfReporteOt}
            client={pdfReporteClient || { id: '', razonSocial: 'Cliente', ruc: '', direccionSede: '', distrito: '', contactoNombre: '', contactoEmail: '', contactoTelefono: '' }}
          />
        </div>
      )}
    </div>
  );
}
