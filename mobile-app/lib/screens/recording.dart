import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'dart:math';
import '../services/api_service.dart';
import '../widgets/glass_card.dart';

class RecordingScreen extends StatefulWidget {
  final bool isPremium;
  const RecordingScreen({Key? key, required this.isPremium}) : super(key: key);

  @override
  _RecordingScreenState createState() => _RecordingScreenState();
}

class _RecordingScreenState extends State<RecordingScreen> {
  bool isRecording = false;
  CameraController? _cameraController;
  int _questionIndex = 1;
  
  // Fake Aggregated SVM Client Tracking Metrics
  int _totalTicks = 0;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isNotEmpty) {
        final frontCamera = cameras.firstWhere(
          (c) => c.lensDirection == CameraLensDirection.front,
          orElse: () => cameras.first,
        );
        _cameraController = CameraController(
          frontCamera,
          ResolutionPreset.medium,
          enableAudio: true,
        );
        await _cameraController!.initialize();
        if (mounted) setState(() {});
      }
    } catch (e) {
      debugPrint("Camera init error: $e");
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }

  void _startRecording() {
    setState(() {
      isRecording = true;
      _totalTicks = 0;
    });
    // Simulating start video recording logic
  }

  void _stopAndSubmit() async {
    setState(() => isRecording = false);
    
    final random = Random();
    
    final metricsPayload = {
      'avgConfidenceScore': (0.75 + (random.nextDouble() * 0.2)) * 100, // Make it 0-100 scale for UI
      'anxietyScore': (0.10 + (random.nextDouble() * 0.3)) * 100,
      'nervousMoments': random.nextInt(5),
      'smileFrequency': random.nextDouble(),
      'eyeContactRatio': 0.82,
      'createdAt': DateTime.now().toIso8601String()
    };

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Analyzing & Submitting...')),
    );

    try {
      await ApiService.processInterviewMetrics(
        clientSideMetrics: metricsPayload,
        domain: 'Engineering',
        subtopic: 'ReactJS',
      );
      
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Interview Analytics Processed!')),
      );
      Navigator.pop(context); // Go back home or to reports
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Upload Failed: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Interview Studio"),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.settings),
            onPressed: () {},
          )
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Prompt Card
              GlassCard(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(LucideIcons.brainCircuit, color: Colors.indigo, size: 20),
                            SizedBox(width: 8),
                            Text("AI Prompt", style: TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.surfaceVariant,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text("Q$_questionIndex/5", style: const TextStyle(fontSize: 12)),
                        )
                      ],
                    ),
                    const Divider(height: 32),
                    const Text(
                      "Ready to begin your interview. Press Start when you are ready.",
                      style: TextStyle(fontSize: 18, height: 1.5),
                    ),
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.amber.withOpacity(0.1),
                        border: Border.all(color: Colors.amber.withOpacity(0.3)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("Tip: ", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.amber)),
                          const Expanded(
                            child: Text("Focus on structured answers using the STAR format (Situation, Task, Action, Result).", style: TextStyle(color: Colors.amber, fontSize: 13)),
                          )
                        ],
                      ),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Camera View
              Container(
                height: 400,
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20)
                  ]
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (_cameraController != null && _cameraController!.value.isInitialized)
                        CameraPreview(_cameraController!)
                      else
                        const Center(child: CircularProgressIndicator()),
                      
                      // Recording Overlay Indicator
                      if (isRecording)
                        Positioned(
                          top: 16,
                          right: 16,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.8),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                CircleAvatar(radius: 4, backgroundColor: Colors.white),
                                SizedBox(width: 8),
                                Text("REC", style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Controls
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  FloatingActionButton.large(
                    onPressed: isRecording ? _stopAndSubmit : _startRecording,
                    backgroundColor: isRecording ? Colors.red : Theme.of(context).primaryColor,
                    child: Icon(isRecording ? LucideIcons.square : LucideIcons.video, color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                isRecording ? "Tap to Stop & Analyze" : "Tap to Start Recording",
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey),
              )
            ],
          ),
        ),
      )
    );
  }
}
