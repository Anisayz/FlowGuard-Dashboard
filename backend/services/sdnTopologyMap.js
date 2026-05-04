function normalizeDpid(d) {
  if (d === undefined || d === null) return '';
  return String(d);
}

/**
 * Maps Ryu /v1.0/topology/* payloads to the dashboard TopologyData shape.
 */
function mapRyuTopologyBundle({ switches, links, hosts }) {
  const switchList = [];
  if (switches && typeof switches === 'object' && !Array.isArray(switches)) {
    for (const dpid of Object.keys(switches)) {
      switchList.push({ dpid: normalizeDpid(dpid) });
    }
  }

  const hostList = [];
  if (hosts && typeof hosts === 'object') {
    const hostValues = Array.isArray(hosts) ? hosts : Object.values(hosts);
    for (const h of hostValues) {
      if (!h || typeof h !== 'object') continue;
      const mac = h.mac || h.hw_addr || '';
      let ipv4 = [];
      if (Array.isArray(h.ipv4)) ipv4 = h.ipv4;
      else if (h.ipv4) ipv4 = [h.ipv4];
      const port = Number(h.port ?? h.port_no ?? 0);
      const dpid = normalizeDpid(h.dpid);
      if (mac) {
        hostList.push({ mac, ipv4, port, dpid });
      }
    }
  }

  const linkList = [];
  let linkValues = [];
  if (Array.isArray(links)) {
    linkValues = links;
  } else if (links && typeof links === 'object') {
    linkValues = Object.values(links);
  }
  for (const l of linkValues) {
    if (!l || typeof l !== 'object') continue;
    if (l.src && l.dst) {
      linkList.push({
        src_dpid: normalizeDpid(l.src.dpid),
        dst_dpid: normalizeDpid(l.dst.dpid),
        src_port: Number(l.src.port ?? l.src.port_no ?? 0),
        dst_port: Number(l.dst.port ?? l.dst.port_no ?? 0),
      });
    } else if (l.src_dpid != null) {
      linkList.push({
        src_dpid: normalizeDpid(l.src_dpid),
        dst_dpid: normalizeDpid(l.dst_dpid),
        src_port: Number(l.src_port ?? 0),
        dst_port: Number(l.dst_port ?? 0),
      });
    }
  }

  return { switches: switchList, hosts: hostList, links: linkList };
}

function mapRyuSwitches(switchesData) {
  if (!switchesData || typeof switchesData !== 'object' || Array.isArray(switchesData)) {
    return [];
  }
  return Object.entries(switchesData).map(([dpid, info]) => {
    const row = info && typeof info === 'object' ? info : {};
    return {
      dpid: normalizeDpid(dpid),
      n_tables: row.n_tables ?? 254,
      capabilities: row.capabilities ?? 79,
    };
  });
}

module.exports = {
  mapRyuTopologyBundle,
  mapRyuSwitches,
};
