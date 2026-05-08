"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import {
  type ConfigTabKey,
  type DifficultyItem,
  type MultiplierItem,
  type PayoutTierItem,
  type PointRulesData,
  type SpRulesData,
  createPayoutTier,
  loadTabData,
  removePayoutTier,
  updateDifficulty,
  updateMultiplier,
  updatePayoutTier,
  updatePointRules,
  updateSpRules,
} from "../_services/config.service";

type ConfigContextType = {
  activeTab: ConfigTabKey;
  setActiveTab: (tab: ConfigTabKey) => void;
  loading: boolean;
  pointRules: PointRulesData | null;
  spRules: SpRulesData | null;
  multipliers: MultiplierItem[];
  difficulties: DifficultyItem[];
  payoutTiers: PayoutTierItem[];
  refreshActiveTab: () => Promise<void>;
  savePointRules: (payload: PointRulesData) => Promise<void>;
  saveSpRules: (payload: SpRulesData) => Promise<void>;
  saveMultiplier: (payload: MultiplierItem) => Promise<void>;
  saveDifficulty: (payload: DifficultyItem) => Promise<void>;
  savePayoutTier: (payload: PayoutTierItem | Omit<PayoutTierItem, "id">) => Promise<void>;
  deletePayoutTierById: (id: string) => Promise<void>;
};

export const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<ConfigTabKey>("point-rules");
  const [loading, setLoading] = useState(true);
  const [pointRules, setPointRules] = useState<PointRulesData | null>(null);
  const [spRules, setSpRules] = useState<SpRulesData | null>(null);
  const [multipliers, setMultipliers] = useState<MultiplierItem[]>([]);
  const [difficulties, setDifficulties] = useState<DifficultyItem[]>([]);
  const [payoutTiers, setPayoutTiers] = useState<PayoutTierItem[]>([]);

  const refreshActiveTab = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadTabData(activeTab);
      if (activeTab === "point-rules") setPointRules(data as PointRulesData);
      if (activeTab === "sp-rules") setSpRules(data as SpRulesData);
      if (activeTab === "multipliers") setMultipliers(data as MultiplierItem[]);
      if (activeTab === "difficulty-settings") setDifficulties(data as DifficultyItem[]);
      if (activeTab === "payout-tiers") setPayoutTiers(data as PayoutTierItem[]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void refreshActiveTab();
  }, [refreshActiveTab]);

  const savePointRulesHandler = useCallback(async (payload: PointRulesData) => {
    const prev = pointRules;
    setPointRules(payload);
    try {
      await updatePointRules(payload);
      showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: "Point rules saved" });
    } catch (error) {
      setPointRules(prev);
      throw error;
    }
  }, [pointRules]);

  const saveSpRulesHandler = useCallback(async (payload: SpRulesData) => {
    const prev = spRules;
    setSpRules(payload);
    try {
      await updateSpRules(payload);
      showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: "SP rules saved" });
    } catch (error) {
      setSpRules(prev);
      throw error;
    }
  }, [spRules]);

  const saveMultiplierHandler = useCallback(async (payload: MultiplierItem) => {
    const prev = multipliers;
    setMultipliers((list) => list.map((item) => (item.code === payload.code ? payload : item)));
    try {
      await updateMultiplier(payload);
      showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: "Multiplier saved" });
    } catch (error) {
      setMultipliers(prev);
      throw error;
    }
  }, [multipliers]);

  const saveDifficultyHandler = useCallback(async (payload: DifficultyItem) => {
    const prev = difficulties;
    setDifficulties((list) => list.map((item) => (item.id === payload.id ? payload : item)));
    try {
      await updateDifficulty(payload);
      showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: "Difficulty updated" });
    } catch (error) {
      setDifficulties(prev);
      throw error;
    }
  }, [difficulties]);

  const savePayoutTierHandler = useCallback(
    async (payload: PayoutTierItem | Omit<PayoutTierItem, "id">) => {
      if ("id" in payload) {
        const prev = payoutTiers;
        setPayoutTiers((list) => list.map((item) => (item.id === payload.id ? payload : item)));
        try {
          await updatePayoutTier(payload);
          showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: "Payout tier updated" });
        } catch (error) {
          setPayoutTiers(prev);
          throw error;
        }
        return;
      }

      const optimisticId = `new-${Date.now()}`;
      const optimistic: PayoutTierItem = { ...payload, id: optimisticId };
      setPayoutTiers((list) => [...list, optimistic]);
      try {
        await createPayoutTier(payload);
        await refreshActiveTab();
      } catch (error) {
        setPayoutTiers((list) => list.filter((item) => item.id !== optimisticId));
        throw error;
      }
    },
    [payoutTiers, refreshActiveTab],
  );

  const deletePayoutTierById = useCallback(
    async (id: string) => {
      const prev = payoutTiers;
      setPayoutTiers((list) => list.filter((item) => item.id !== id));
      try {
        await removePayoutTier(id);
        showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: "Payout tier deleted" });
      } catch (error) {
        setPayoutTiers(prev);
        throw error;
      }
    },
    [payoutTiers],
  );

  const value = useMemo<ConfigContextType>(
    () => ({
      activeTab,
      setActiveTab,
      loading,
      pointRules,
      spRules,
      multipliers,
      difficulties,
      payoutTiers,
      refreshActiveTab,
      savePointRules: savePointRulesHandler,
      saveSpRules: saveSpRulesHandler,
      saveMultiplier: saveMultiplierHandler,
      saveDifficulty: saveDifficultyHandler,
      savePayoutTier: savePayoutTierHandler,
      deletePayoutTierById,
    }),
    [
      activeTab,
      deletePayoutTierById,
      difficulties,
      loading,
      multipliers,
      payoutTiers,
      pointRules,
      refreshActiveTab,
      saveDifficultyHandler,
      saveMultiplierHandler,
      savePayoutTierHandler,
      savePointRulesHandler,
      saveSpRulesHandler,
      spRules,
    ],
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}
