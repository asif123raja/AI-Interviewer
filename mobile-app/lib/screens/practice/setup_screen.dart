import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../widgets/glass_card.dart';
import '../recording.dart';

class SetupScreen extends StatefulWidget {
  const SetupScreen({Key? key}) : super(key: key);

  @override
  _SetupScreenState createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  final _domainCtrl = TextEditingController(text: "Software Engineering");
  final _roleCtrl = TextEditingController(text: "Frontend Developer");
  String _experience = "Mid-Level";

  final List<String> _experiences = ["Entry Level", "Mid-Level", "Senior", "Lead/Manager"];

  void _startInterview() {
    // In actual app, might need to call backend to generate prompts first
    Navigator.push(
      context, 
      MaterialPageRoute(
        builder: (_) => RecordingScreen(
          isPremium: true, 
          // Passing domain/role config could be added here
        )
      )
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Interview Setup"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(LucideIcons.brain, color: Colors.indigo),
                SizedBox(width: 8),
                Text("AI Interview Engine", style: TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 24),
            const Text("Configure your practice session", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text("Tailor the AI interviewer to match your target role and experience level.", style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 32),

            GlassCard(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Role Details", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 16),
                  
                  TextField(
                    controller: _domainCtrl,
                    decoration: const InputDecoration(
                      labelText: "Industry / Domain",
                      hintText: "e.g. Software Engineering",
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  TextField(
                    controller: _roleCtrl,
                    decoration: const InputDecoration(
                      labelText: "Specific Role",
                      hintText: "e.g. React Developer",
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  const Text("Experience Level", style: TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _experiences.map((exp) {
                      final isSelected = _experience == exp;
                      return ChoiceChip(
                        label: Text(exp),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) setState(() => _experience = exp);
                        },
                        selectedColor: Theme.of(context).primaryColor,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : Theme.of(context).textTheme.bodyMedium?.color
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton.icon(
                onPressed: _startInterview,
                icon: const Icon(LucideIcons.video),
                label: const Text("Start Simulation"),
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
