import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const data = [
    { name: 'Reuniones de Proyecto', value: 400 },
    { name: 'Demostraciones', value: 300 },
    { name: 'Entrevistas', value: 300 },
    { name: 'Auditorías', value: 200 },
    { name: 'Otros', value: 150 },
];
const COLORS = ['#2283e5', '#5cbaf8', '#93d2fc', '#c2e3fd', '#e0f0fe'];

export const ReportsPage: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Reportes de Visitas</h2>
            
            <div className="flex items-center space-x-4 mb-8 p-4 bg-gray-50 rounded-lg border">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                    <input type="date" id="startDate" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-securiti-blue-500 focus:border-securiti-blue-500 sm:text-sm"/>
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                    <input type="date" id="endDate" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-securiti-blue-500 focus:border-securiti-blue-500 sm:text-sm"/>
                </div>
                <button className="self-end px-4 py-2 font-semibold text-white bg-securiti-blue-600 rounded-lg shadow-md hover:bg-securiti-blue-700 transition-colors">
                    Generar Reporte
                </button>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Visitas por Motivo</h3>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};