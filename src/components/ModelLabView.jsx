import React, { useState, useEffect } from 'react'
import * as tf from '@tensorflow/tfjs'
import {
  Cpu,
  Zap,
  FileCode2,
  Play
} from 'lucide-react'
import { getRiskModel, calculateRiskScore } from '../services/aiRiskModel'

export function ModelLabView() {
  const [modelInfo, setModelInfo] = useState(null)
  const [tfBackend, setTfBackend] = useState('detecting...')
  const [benchmarkResult, setBenchmarkResult] = useState(null)
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false)

  useEffect(() => {
    async function inspectTF() {
      try {
        await tf.ready()
        setTfBackend(tf.getBackend())
        const { model, source } = await getRiskModel()
        
        let totalParams = 0
        model.layers.forEach(l => {
          totalParams += l.countParams()
        })

        setModelInfo({
          source,
          layersCount: model.layers.length,
          totalParams,
          inputShape: model.inputs[0].shape,
          outputShape: model.outputs[0].shape
        })
      } catch (err) {
        console.error('Error inspecting TF.js:', err)
      }
    }
    inspectTF()
  }, [])

  const handleRunBenchmark = async () => {
    setIsRunningBenchmark(true)
    const iterations = 50
    const sampleVitals = {
      fullName: 'Benchmark Test',
      age: 26,
      gestationalAge: 32,
      systolicBP: 145,
      diastolicBP: 94,
      heartRate: 88,
      bloodGlucose: 110,
      bodyTemp: 98.6,
      symptoms: ['severe_headache']
    }

    // Warm-up run
    await calculateRiskScore(sampleVitals)

    const start = performance.now()
    for (let i = 0; i < iterations; i++) {
      await calculateRiskScore(sampleVitals)
    }
    const elapsed = performance.now() - start
    const avgLatency = Math.round((elapsed / iterations) * 10) / 10

    setBenchmarkResult({
      iterations,
      totalTimeMs: Math.round(elapsed),
      avgLatencyMs: avgLatency,
      fps: Math.round(1000 / avgLatency)
    })
    setIsRunningBenchmark(false)
  }

  return (
    <div className="space-y-5">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-teal-100 text-teal-800">
              <Cpu className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                TensorFlow.js Edge AI Diagnostic Lab
              </h2>
              <p className="text-xs text-slate-500">
                100% Client-Side Machine Learning Execution & Model Architecture
              </p>
            </div>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isRunningBenchmark}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
          >
            {isRunningBenchmark ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Benchmarking 50 Passes...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-teal-300" />
                <span>Run Latency Benchmark</span>
              </>
            )}
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold block text-[11px]">Hardware Acceleration</span>
            <span className="font-bold text-teal-800 text-sm font-mono uppercase mt-0.5 block">
              {tfBackend}
            </span>
            <span className="text-[10px] text-slate-400">Zero cloud API calls</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold block text-[11px]">Model Source</span>
            <span className="font-bold text-slate-800 text-xs truncate mt-0.5 block font-mono">
              {modelInfo?.source || 'Loading...'}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">Active in Memory</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold block text-[11px]">Model Parameters</span>
            <span className="font-bold text-slate-800 text-sm font-mono mt-0.5 block">
              {modelInfo?.totalParams ? `${modelInfo.totalParams} weights` : 'Calculating...'}
            </span>
            <span className="text-[10px] text-slate-400">{modelInfo?.layersCount || 3} dense layers</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold block text-[11px]">Inference Performance</span>
            <span className="font-bold text-emerald-700 text-sm font-mono mt-0.5 block">
              {benchmarkResult ? `${benchmarkResult.avgLatencyMs} ms` : '~2-8 ms avg'}
            </span>
            <span className="text-[10px] text-slate-400">Instant offline triage</span>
          </div>
        </div>
      </div>

      {/* Latency Benchmark Results (if ran) */}
      {benchmarkResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="font-bold block">Benchmark Completed (50 Inferences):</span>
              <span>
                Average Latency: <strong>{benchmarkResult.avgLatencyMs} ms</strong> ({benchmarkResult.fps} inferences/sec).
                Total duration: {benchmarkResult.totalTimeMs} ms.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 font-extrabold text-xs">
            Blazing Fast
          </span>
        </div>
      )}

      {/* Custom Model Integration Instructions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-sm text-slate-900">
            How to Deploy Your Custom TensorFlow / Keras Model
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The application comes out of the box with a pre-calibrated Sequential Neural Network trained on
          maternal risk indicators. If your health organization has a custom trained Python/Keras or PyTorch model:
        </p>

        <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs space-y-2 border border-slate-800">
          <div className="text-slate-400">// 1. Convert your trained Keras model (.h5 or SavedModel) to TF.js format:</div>
          <div className="text-teal-300">
            pip install tensorflowjs<br />
            tensorflowjs_converter --input_format=keras maternal_model.h5 ./public/model/
          </div>
          <div className="text-slate-400 mt-2">// 2. Verify files are placed in:</div>
          <div className="text-teal-200">
            public/<br />
            &nbsp;&nbsp;└── model/<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── model.json<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── group1-shard1of1.bin
          </div>
          <div className="text-slate-400 mt-2">// 3. Model detection:</div>
          <div className="text-slate-300">
            The app automatically detects <code>/model/model.json</code> on boot, caches it in the Service Worker, and runs offline inference without any code change!
          </div>
        </div>
      </div>
    </div>
  )
}
