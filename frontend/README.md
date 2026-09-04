# Noki Frontend - Mobile App for Sunset Scores

This React web UI is built for Noki, a sunset score service. It shows sunset and sunrise quality based on where you are. It uses live location data and a set of weather inputs.

## Get going

### Run on your machine

```bash
# Backend in one terminal
$env:PYTHONPATH="src"
uvicorn sunset_score.api:app --reload

# Frontend in another terminal
cd frontend
npm run dev
```

### Check on mobile
```bash
# Run the test helper
.\test-setup.bat
```

### Production build
```bash
# Start with Docker Compose
docker-compose up --build
```\n
## What it does

### Scoring method
- It uses a 6-part check: cloud cover, mid and high cloud amount, low cloud near the horizon, humidity, visibility, precipitation. It also includes temperature-based color strength.
- You get a simple score from 0 to 100.
- You also see reasons behind the score, not just the number.
- It includes a 5-day view, with a short trend look and a best-day pick.

### Mobile experience
- Location is handled automatically at first. If that fails, you can search by hand.
- It watches for secure context needs on mobile and gives guidance for HTTPS.
- The layout is made for taps. Animations stay smooth during use.
- Scrolling stays fast. It uses less backdrop-filter than you might expect.

### Visual style
- The score uses a hologram-like display with a CD feel.
- Colors shift based on how high or low the score is.
- Animations are kept light and polished, with small transitions.
- The design adjusts for phones and larger screens.

### Privacy
- No sign-in needed. The app does not ask you to create an account.
- All shown data comes from the weather inputs and your selected location.

### Geolocation Features
- **Auto-Detection**: Automatically finds your location
- **Smart Fallback**: Shows manual search when geolocation is blocked
- **Clear Error Messages**: "Location access needs a secure connection - please search for your location manually instead"
- **Automatic Picker**: Opens location search when geolocation fails

## Understanding the Scoring

### 6-Factor Analysis
The app analyzes **six key factors** to determine sunset/sunrise quality:

| Factor | Points | What It Measures |
|--------|--------|------------------|
| Total Cloud Cover | 0-10 | Overall sky coverage |
| Mid/High Cloud Canvas | 0-25 | Color scattering potential |
| Low Cloud Horizon | 0-20 | Horizon clearance |
| Relative Humidity | 0-10 | Atmospheric clarity |
| Visibility | 0-10 | Air quality and distance |
| Temperature-Based Color | 0-15 | Optimal color development |

### Score Interpretation
- **90-100**: Perfect conditions - exceptional colors expected
- **70-89**: Excellent - great sunset/sunrise ahead
- **50-69**: Good - pleasant colors with some character
- **30-49**: Fair - visible but not spectacular
- **0-29**: Poor - limited color potential

## Technical Specifications

### Frontend Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite for rapid development
- **Styling**: CSS with custom properties
- **State Management**: React Context API
- **Mobile Features**: Capacitor integration

### Backend Stack
- **Framework**: FastAPI with Python 3.14
- **Database**: SQLite with local caching
- **Weather Integration**: Open-Meteo API
- **CORS**: Fully permissive for mobile access

## Performance Optimizations

### Mobile-First Design
- **Minimal Backdrop-Filter**: Reduced GPU usage for smooth scrolling
- **Transform-Based Animations**: GPU-accelerated animations
- **Efficient Rendering**: Optimized component tree
- **Touch Targets**: Properly sized for mobile interaction

### Development Experience
- **Hot Reload**: Instant feedback during development
- **Type Safety**: Full TypeScript support
- **Linting**: Code quality enforcement
- **Build Optimization**: Production-ready bundling

## Troubleshooting

### Common Issues

**Backend Won't Start**
```powershell
# Check Python path
$env:PYTHONPATH="src"
uvicorn sunset_score.api:app --reload
```

**Frontend Won't Load**
```bash
cd frontend
npm run dev
```

**Mobile Connection Issues**
- Ensure backend is running on `http://127.0.0.1:8000`
- Check firewall settings
- Verify same network connectivity

### Getting Help
1. **Check Logs**: Review terminal output for errors
2. **Test Backend**: `curl http://127.0.0.1:8000/health`
3. **Test Frontend**: Visit `http://localhost:5173`
4. **Mobile Test**: Use `http://192.168.x.x:5173` on phone

## Development

### Running Tests
```bash
# Python tests
pytest

# Frontend linting
cd frontend
npm run lint
```

### Code Quality
- Follow existing code style and conventions
- Add tests for new features
- Update documentation
- Run linting before committing

## 🎨 Design Philosophy

### Mobile-First Approach
- **Touch Optimized**: All interactions designed for mobile
- **Performance First**: Minimal GPU usage for smooth scrolling
- **Accessibility**: Screen reader compatible and keyboard navigable
- **Visual Hierarchy**: Clear information architecture

### User Experience
- **Progressive Disclosure**: Show only what's needed
- **Clear Feedback**: Visual and haptic responses
- **Error Recovery**: Always provide fallback options
- **Offline Capability**: Local caching for intermittent connectivity

## 🔄 Future Enhancements

### Planned Features
- **Weather Alerts**: Push notifications for optimal conditions
- **Social Sharing**: Share your perfect moments
- **Custom Locations**: Save and manage favorite spots
- **Advanced Analytics**: Detailed weather pattern analysis

### Performance Goals
- **60fps Scrolling**: Smooth mobile scrolling experience
- **Instant Load**: Fast initial page load times
- **Offline Support**: Full functionality without internet
- **Battery Optimization**: Minimal power consumption

---

**Ready to explore the skies?** Start with the quick setup commands above and discover your perfect sunset moments!

---

*Made with by Jazzy (Rayan Ait jilali)*