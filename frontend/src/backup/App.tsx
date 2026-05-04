import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import DashboardHome from './components/DashboardHome';

import RulesTable from './components/RulesTable';
import AddRuleForm from './components/AddRuleForm';
import HealthStatus from './components/HealthStatus';
import { Rule, Switch, MacEntry, TopologyData, ViewId } from './types';
import './App.css';
import RyuHealthDetail        from './components/RyuHealthDetail';
import MitigationEngineDetail from './components/MitigationEngineDetail';
import FirewallRules from './components/FirewallRules';
import AlertsTable from './components/AlertsTable';
import InfrastructureDetails from './components/InfrastructureDetails';
const API_BASE = 'http://localhost:8000';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewId>('home');
  const [rules, setRules] = useState<Rule[]>([]);
  const [switches, setSwitches] = useState<Switch[]>([]);
  const [macTable, setMacTable] = useState<MacEntry[]>([]);
  const [topology, setTopology] = useState<TopologyData | null>(null)
  const [health, setHealth] = useState<any>({});
  const [topoLoading, setTopoLoading] = useState(true);
const [topoError,   setTopoError]   = useState<string | undefined>();

 const fetchAll = async () => {
  setTopoLoading(true);
  setTopoError(undefined);
 console.log("u are fetching everything")
  try {
    const [rulesRes, switchesRes, macRes, healthRes] = await Promise.all([
      console.log("u are here qxios"),
      axios.get(`${API_BASE}/rules`), 
      axios.get(`${API_BASE}/switches`),
      axios.get(`${API_BASE}/mactable`),
      axios.get(`${API_BASE}/health`),
    ]);
    setRules(rulesRes.data);
    setSwitches(switchesRes.data);
    setMacTable(macRes.data);
    setHealth(healthRes.data);
  } catch (err) {
    console.error('Fetch error:', err);
  }

  // Topology séparée pour gérer son propre état loading/error
  try {
    const topoRes = await axios.get(`${API_BASE}/topology`);
    setTopology(topoRes.data);
    setTopoError(undefined);
  } catch (err) {
    setTopoError('Cannot reach Ryu controller');
    console.error('Topology fetch error:', err);
  } finally {
    setTopoLoading(false);
  }
};

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  const availableDpids = switches.map((s) => s.dpid);

  const renderView = () => {
    switch (activeView) {
      case 'home':
  return (
    <DashboardHome
      topology={topology}
      isLoading={topoLoading}   // ← ajouter
      error={topoError}         // ← ajouter
    />
  );
      
      case 'infrastructure':
  return <InfrastructureDetails />;
      case 'alerts':
  return <AlertsTable />;
      case 'ryu-health':
  return <RyuHealthDetail    onBack={() => setActiveView('home')} />;
case 'engine-health':
  return <MitigationEngineDetail onBack={() => setActiveView('home')} />;
      case 'rules':     return (
        <>
          <AddRuleForm availableDpids={availableDpids} onRuleAdded={fetchAll} />
          <RulesTable rules={rules} onDelete={fetchAll} />
        </>
      );
      case 'rules':
  return (
    <FirewallRules
      rules={rules}
      onRefresh={fetchAll}
      availableDpids={switches.map((s: any) => s.dpid)}
    />
  );
      
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main style={{ flex: 1, padding: 20 }}>
    <HealthStatus
  health={{ controller: health.controller || 'unhealthy', mitigation_engine: health.mitigation_engine || 'unhealthy' }}
  onNavigate={setActiveView}
/>
        {renderView()}
      </main>
    </div>
  );
};

export default App;