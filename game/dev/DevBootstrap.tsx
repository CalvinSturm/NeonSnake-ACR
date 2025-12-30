
import React, { useState } from 'react';
import { CameraMode, DevBootstrapConfig } from '../../types';
import { audio } from '../../utils/audio';

interface DevBootstrapProps {
  onBoot: (config: DevBootstrapConfig) => void;
  onCancel: () => void;
  onToggleFreeRoam?: () => void; // New prop for runtime toggle
}

export const DevBootstrap: React.FC<DevBootstrapProps> = ({ onBoot, onCancel, onToggleFreeRoam }) => {
  const [stageId, setStageId] = useState(5);
  const [bossPhase, setBossPhase] = useState(0); // 0 = Phase 1
  const [cameraMode, setCameraMode] = useState<CameraMode>(CameraMode.SIDE_SCROLL);
  const [forceBoss, setForceBoss] = useState(true);
  const [freeMovement, setFreeMovement] = useState(false);
  const [disableWalls, setDisableWalls] = useState(false);

  const handleBoot = () => {
    audio.play('UI_HARD_CLICK');
    onBoot({
        stageId,
        bossPhase,
        cameraMode,
        forceBoss,
        freeMovement,
        disableWalls
    });
  };

  const handleOpenInstance = () => {
      audio.play('UI_HARD_CLICK');
      onBoot({
          stageId: 1,
          cameraMode: CameraMode.TOP_DOWN,
          cameraBehavior: 'MANUAL',
          forceBoss: false,
          freeMovement: true,
          disableWalls: true
      });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center font-mono text-xs pointer-events-auto">
        <div className="bg-[#111] border-2 border-red-500 p-8 w-96 shadow-[0_0_50px_rgba(255,0,0,0.2)] relative">
            <div className="absolute top-0 left-0 bg-red-600 text-black font-bold px-2 py-1 text-[10px]">DEV_BOOTSTRAP_PROTOCOL</div>
            
            <div className="space-y-6 mt-4">
                {/* Stage Select */}
                <div className="flex flex-col gap-2">
                    <label className="text-red-400 font-bold uppercase">Target Sector (Stage)</label>
                    <div className="flex gap-2">
                        {[1, 4, 5, 10].map(s => (
                            <button 
                                key={s}
                                onClick={() => setStageId(s)}
                                className={`px-3 py-2 border ${stageId === s ? 'bg-red-900 border-red-500 text-white' : 'border-gray-700 text-gray-500'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="text-gray-600 text-[10px] mt-1">
                        4 = Sentinel | 5 = Warden
                    </div>
                </div>

                {/* Boss Phase */}
                <div className="flex flex-col gap-2">
                    <label className="text-red-400 font-bold uppercase">Boss Phase (Index)</label>
                    <div className="flex gap-2">
                        <button onClick={() => setBossPhase(0)} className={`flex-1 py-2 border ${bossPhase === 0 ? 'bg-red-900 border-red-500' : 'border-gray-700 text-gray-500'}`}>0 (P1)</button>
                        <button onClick={() => setBossPhase(1)} className={`flex-1 py-2 border ${bossPhase === 1 ? 'bg-red-900 border-red-500' : 'border-gray-700 text-gray-500'}`}>1 (P2)</button>
                    </div>
                </div>

                {/* Camera */}
                <div className="flex flex-col gap-2">
                    <label className="text-red-400 font-bold uppercase">Camera Mode</label>
                    <select 
                        value={cameraMode} 
                        onChange={(e) => setCameraMode(e.target.value as CameraMode)}
                        className="bg-black border border-gray-700 text-white p-2 outline-none focus:border-red-500"
                    >
                        <option value={CameraMode.TOP_DOWN}>TOP_DOWN</option>
                        <option value={CameraMode.SIDE_SCROLL}>SIDE_SCROLL</option>
                    </select>
                </div>

                {/* Toggles */}
                <div className="space-y-2 border-t border-gray-800 pt-2">
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="forceBoss" 
                            checked={forceBoss} 
                            onChange={(e) => setForceBoss(e.target.checked)}
                            className="accent-red-500"
                        />
                        <label htmlFor="forceBoss" className="text-gray-300">Force Boss Spawn</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="freeMovement" 
                            checked={freeMovement} 
                            onChange={(e) => setFreeMovement(e.target.checked)}
                            className="accent-red-500"
                        />
                        <label htmlFor="freeMovement" className="text-gray-300">Free Movement (No Gravity)</label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="disableWalls" 
                            checked={disableWalls} 
                            onChange={(e) => setDisableWalls(e.target.checked)}
                            className="accent-red-500"
                        />
                        <label htmlFor="disableWalls" className="text-gray-300">Clear Walls (Blank Canvas)</label>
                    </div>
                </div>
            </div>

            {/* RUNTIME CONTROLS */}
            {onToggleFreeRoam && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                    <button 
                        onClick={onToggleFreeRoam}
                        className="w-full py-2 border border-yellow-700 text-yellow-500 hover:bg-yellow-900/30 transition-colors font-bold mb-2"
                    >
                        TOGGLE FREE ROAM (CAM + PHYS)
                    </button>
                </div>
            )}

            <div className="mt-4 flex gap-4">
                <button 
                    onClick={onCancel}
                    className="flex-1 py-3 border border-gray-700 text-gray-500 hover:text-white transition-colors"
                >
                    CANCEL
                </button>
                <button 
                    onClick={handleBoot}
                    className="flex-1 py-3 bg-red-600 text-black font-bold hover:bg-red-500 transition-colors"
                >
                    EXECUTE
                </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-800">
                <button 
                    onClick={handleOpenInstance}
                    className="w-full py-2 bg-blue-900 border border-blue-500 text-blue-100 font-bold hover:bg-blue-800 transition-colors"
                >
                    OPEN INSTANCE (MANUAL CAMERA)
                </button>
            </div>
        </div>
    </div>
  );
};
